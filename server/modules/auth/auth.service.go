package auth

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"time"

	"linklab-server/aws/sqs"
	"linklab-server/config"
	"linklab-server/db"
	"linklab-server/logger"
	"linklab-server/model"
	"linklab-server/utils"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type EmailEvent struct {
	Name    string `json:"name"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

var releaseSignupLockScript = redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
end
return 0
`)

func releaseSignupLock(ctx context.Context, lockKey, sessionID string) {
	releaseSignupLockScript.Run(
		ctx,
		db.RedisClient,
		[]string{lockKey},
		sessionID,
	).Result()
}

func RegisterUserService(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	users := db.MongoClient.Database("linklab").Collection("users")
	email := strings.ToLower(req.Email)
	var existinguser model.User
	err := users.FindOne(ctx, bson.M{
		"email": email,
	}).Decode(&existinguser)
	if err == nil {
		return nil, ErrUserAlreadyExists
	}
	if err != mongo.ErrNoDocuments {
		return nil, err
	}
	sessionID := uuid.NewString()
	lockKey := "signup_lock:" + email
	locked, err := db.RedisClient.SetNX(
		ctx,
		lockKey,
		sessionID,
		config.SignupSessionTTL,
	).Result()
	if err != nil {
		return nil, err
	}
	if !locked {
		return nil, ErrSignupAlreadyInProgress
	}
	var success bool
	defer func() {
		if !success {
			releaseSignupLock(ctx, lockKey, sessionID)
		}
	}()

	sessionKey := "signup:" + sessionID
	hashedPassword, err := utils.HashPassword(req.Password, 10)
	if err != nil {
		return nil, err
	}
	otp := utils.GenerateOTP(6)
	now := time.Now()
	err = db.RedisClient.HSet(ctx, sessionKey, map[string]interface{}{
		"name":                req.Name,
		"email":               email,
		"password":            string(hashedPassword),
		"otp":                 otp,
		"otp_attempts":        0,
		"otp_reattempts":      0,
		"otp_resend_cooldown": now.Add(config.ResendCoolDown).Unix(),
		"otp_expires_at":      now.Add(config.OtpExpirationTime).Unix(),
	}).Err()
	if err != nil {
		return nil, err
	}
	if err := db.RedisClient.Expire(ctx, sessionKey, config.SignupSessionTTL).Err(); err != nil {
		return nil, err
	}
	emailEvent := EmailEvent{
		Name:    "LinkLab",
		To:      email,
		Subject: "LinkLab OTP Verification",
		HTML: `
		<div style="font-family: Arial, sans-serif; line-height: 1.6;">
			<h2>Verify your email</h2>
			<p>Your One-Time Password (OTP) is:</p>
			<h1 style="letter-spacing: 4px;">` + otp + `</h1>
			<p>This OTP is valid for <b>1 minutes</b>.</p>
			<p>If you did not request this, please ignore this email.</p>
			<br/>
			<p>— Team LinkLab</p>
		</div>
	`,
	}
	payload, err := json.Marshal(emailEvent)
	if err != nil {
		log.Printf("SQS send failed: %+v", err)
		return nil, err
	}
	err = sqs.Send(
		ctx,
		sqs.GetClient(),
		config.SQSSignupQueueURL,
		string(payload),
	)
	if err != nil {
		return nil, err
	}
	success = true
	return &RegisterResponse{
		Email:     req.Email,
		SessionId: sessionID,
		Message:   "Signup process initiated. OTP sent successfully",
	}, nil
}

func VerifyOTPService(ctx context.Context, sessionId string, otp string) (*model.User, error) {
	redisSessionKey := "signup:" + sessionId
	data, err := db.RedisClient.HGetAll(ctx, redisSessionKey).Result()
	if err != nil || len(data) == 0 {
		logger.Error("redis hash key expired ", err)
		return nil, ErrSessionExpired
	}
	otpExpiresAt, err := strconv.ParseInt(data["otp_expires_at"], 10, 64)
	if err != nil {
		return nil, ErrSessionCorrupted
	}
	if time.Now().Unix() > otpExpiresAt {
		releaseSignupLock(ctx, "signup_lock:"+data["email"], sessionId)
		db.RedisClient.Del(ctx, redisSessionKey)
		return nil, ErrOTPExpired
	}
	attempts, err := strconv.Atoi(data["otp_attempts"])
	if err != nil {
		return nil, ErrSessionCorrupted
	}
	if attempts >= config.OTPAttempts {
		releaseSignupLock(ctx, "signup_lock:"+data["email"], sessionId)
		db.RedisClient.Del(ctx, redisSessionKey)
		return nil, ErrTooManyAttempts
	}
	if data["otp"] != otp {
		db.RedisClient.HIncrBy(ctx, redisSessionKey, "otp_attempts", 1)
		return nil, ErrInvalidOTP
	}
	users := db.MongoClient.Database("linklab").Collection("users")
	user := model.User{
		Email:     data["email"],
		Name:      data["name"],
		Password:  data["password"],
		CreatedAt: time.Now(),
	}
	res, err := users.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrUserAlreadyExists
		}
		logger.Error("mongodb error in verifyotp route", err)
		return nil, err
	}
	user.ID = res.InsertedID.(primitive.ObjectID)
	releaseSignupLock(ctx, "signup_lock:"+data["email"], sessionId)
	db.RedisClient.Del(ctx, redisSessionKey)
	return &user, nil
}

func ResendOTPService(ctx context.Context, sessionId string) error {
	redisSessionKey := "signup:" + sessionId
	data, err := db.RedisClient.HGetAll(ctx, redisSessionKey).Result()
	if err != nil || len(data) == 0 {
		logger.Error("redis hash key expired ", err)
		return ErrSessionExpired
	}
	reattempts, _ := strconv.Atoi(data["otp_reattempts"])
	if reattempts >= config.MaxOTPResendAttempts {
		releaseSignupLock(ctx, "signup_lock:"+data["email"], sessionId)
		db.RedisClient.Del(ctx, redisSessionKey)
		return ErrTooManyAttempts
	}
	if next, ok := data["otp_resend_cooldown"]; ok {
		nextResendAt, _ := strconv.ParseInt(next, 10, 64)
		if time.Now().Unix() < nextResendAt {
			return ErrResendCoolDownTime
		}
	}
	newOTP := utils.GenerateOTP(6)
	_, err = db.RedisClient.HSet(ctx, redisSessionKey, map[string]interface{}{
		"otp":                 newOTP,
		"otp_reattempts":      reattempts + 1,
		"otp_resend_cooldown": time.Now().Add(config.ResendCoolDown).Unix(),
		"otp_expires_at":      time.Now().Add(config.OtpExpirationTime).Unix(),
	}).Result()
	if err != nil {
		return err
	}
	emailEvent := EmailEvent{
		Name:    "LinkLab",
		To:      data["email"],
		Subject: "LinkLab OTP Verification",
		HTML: `
		<div style="font-family: Arial, sans-serif; line-height: 1.6;">
			<h2>Verify your email</h2>
			<p>Your One-Time Password (OTP) is:</p>
			<h1 style="letter-spacing: 4px;">` + newOTP + `</h1>
			<p>This OTP is valid for <b>1 minutes</b>.</p>
			<p>If you did not request this, please ignore this email.</p>
			<br/>
			<p>— Team LinkLab</p>
		</div>
	`,
	}
	payload, err := json.Marshal(emailEvent)
	if err != nil {
		log.Printf("SQS send failed: %+v", err)
		return err
	}
	err = sqs.Send(
		ctx,
		sqs.GetClient(),
		config.SQSSignupQueueURL,
		string(payload),
	)
	if err != nil {
		return err
	}
	return nil
}
