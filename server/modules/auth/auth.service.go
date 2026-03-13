package auth

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"linklab-server/aws/sqs"
	"linklab-server/config"
	apperrors "linklab-server/errors"
	"linklab-server/errors/autherror"
	"linklab-server/errors/mongoerror"
	"linklab-server/errors/rediserror"
	utilserror "linklab-server/errors/utilsError"
	"linklab-server/logger"
	"linklab-server/model"
	"linklab-server/modules/mongo"
	redisCommonService "linklab-server/modules/redis/common"
	redisHashService "linklab-server/modules/redis/hash"
	"linklab-server/utils"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmailEvent struct {
	Name    string `json:"name"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

type AuthService struct {
	redisHash   *redisHashService.RedisHashService
	redisCommon *redisCommonService.RedisCommonService
	user        *mongo.UserService
}

func NewAuthService(
	user *mongo.UserService,
	redisHash *redisHashService.RedisHashService,
	redisCommon *redisCommonService.RedisCommonService,
) *AuthService {
	if user == nil || redisHash == nil || redisCommon == nil {
		panic("auth service dependencies must not be nil")
	}
	return &AuthService{
		user:        user,
		redisHash:   redisHash,
		redisCommon: redisCommon,
	}
}

func toStr(v int64) string {
	return strconv.FormatInt(v, 10)
}

var awsConfig = config.LoadAWSConfig()

func (s *AuthService) RegisterUserService(ctx context.Context, req RegisterRequest) (*RegisterServiceResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	_, err := s.user.Find(
		ctx,
		bson.M{"email": email},
	)

	if err == nil {
		return nil, apperrors.WrapAuth(autherror.ErrUserAlreadyExists)
	}
	if !errors.Is(err, mongoerror.ErrNotFound) {
		logger.Error("registerUserService: mongodb find failed: ", err)
		return nil, apperrors.ErrMongo
	}

	sessionID := uuid.NewString()
	lockKey := "signup_lock:" + email
	locked, err := s.redisCommon.AcquireLock(
		ctx,
		lockKey,
		sessionID,
		config.SignupSessionTTL,
	)
	if err != nil {
		logger.Error("registerUserService: failed to acquire signup lock: ", err)
		return nil, apperrors.ErrRedis
	}
	if !locked {
		return nil, apperrors.WrapAuth(autherror.ErrSignupAlreadyInProgress)
	}

	var success bool
	var sessionCreated bool
	defer func() {
		if success {
			return
		}
		if sessionCreated {
			if err := s.redisCommon.DeleteStrict(ctx, "signup:"+sessionID); err != nil {
				logger.Error("registerUserService: failed to delete signup session: ", err)
			}
		}
		if err := s.redisCommon.ReleaseLock(ctx, lockKey, sessionID); err != nil {
			if errors.Is(err, rediserror.ErrLockNotOwned) {
				logger.Debug("signup lock already released or expired", logger.F("key", lockKey))
			} else {
				logger.Error("registerUserService: failed to release signup lock", err)
			}
		}
	}()

	hashedPassword, err := utils.HashPassword(req.Password, 10)
	if err != nil {
		logger.Error("registerUserService: password hashing failed: ", err)
		return nil, apperrors.ErrUtils
	}

	sessionKey := "signup:" + sessionID
	otp := utils.GenerateOTP(6)
	now := time.Now()
	err = s.redisHash.CreateHash(ctx, sessionKey, map[string]string{
		"name":                req.Name,
		"email":               email,
		"password":            string(hashedPassword),
		"otp":                 otp,
		"otp_attempts":        toStr(0),
		"otp_resend_attempts": toStr(0),
		"otp_resend_after":    toStr(now.Add(config.ResendCoolDown).Unix()),
		"otp_expires_at":      toStr(now.Add(config.OtpExpirationTime).Unix()),
	}, config.SignupSessionTTL)
	if err != nil {
		logger.Error("registerUserService: redis hash create failed: ", err)
		return nil, apperrors.ErrRedis
	}
	sessionCreated = true
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
		logger.Error("registerUserService: marshal email event failed: ", err, logger.F("email", email))
		return nil, apperrors.ErrUtils
	}
	go func(email string, payload []byte) {
		bgCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := sqs.Send(
			bgCtx,
			sqs.GetClient(),
			awsConfig.SQSQueueURL,
			string(payload),
		); err != nil {
			logger.Error("async SQS send failed", err, logger.F("email", email))
		}
	}(email, payload)
	success = true
	return &RegisterServiceResponse{
		SessionId: sessionID,
		Email:     email,
		Message:   "Verification code sent to your email",
	}, nil
}

func (s *AuthService) GetSignupSessionDataService(ctx context.Context, sessionId string) (*SignupSessionInfoResponse, error) {
	sessionKey := "signup:" + sessionId
	data, err := s.redisHash.GetHash(ctx, sessionKey)
	if err != nil || len(data) == 0 {
		logger.Error("verifyOTPService: failed to fetch signup session: ", err, logger.F("key", sessionKey))
		return nil, apperrors.WrapAuth(autherror.ErrSessionExpired)
	}
	requiredFields := []string{
		"email", "otp_resend_after",
	}
	values := make(map[string]string, len(requiredFields))
	for _, field := range requiredFields {
		v, ok := data[field]
		if !ok || v == "" {
			logger.Error(
				"verifyOTPService: missing required field: ",
				err,
				logger.F("field", field),
			)
			if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
				logger.Error("verifyOTPService: release signup lock failed: ", err)
			}
			if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
				logger.Error("verifyOTPService: delete signup session failed: ", err)
			}
			return nil, apperrors.WrapAuth(autherror.ErrSessionCorrupted)
		}
		values[field] = v
	}
	return &SignupSessionInfoResponse{
		Email:          values["email"],
		OTPResendAfter: values["otp_resend_after"],
	}, nil

}

func (s *AuthService) VerifyOTPService(ctx context.Context, sessionId string, otp string) (*model.User, error) {
	sessionKey := "signup:" + sessionId
	data, err := s.redisHash.GetHash(ctx, sessionKey)
	if err != nil || len(data) == 0 {
		logger.Error("verifyOTPService: failed to fetch signup session: ", err, logger.F("key", sessionKey))
		return nil, apperrors.WrapAuth(autherror.ErrSessionExpired)
	}
	requiredFields := []string{
		"email", "otp", "otp_attempts",
		"otp_expires_at", "name", "password",
	}
	for _, field := range requiredFields {
		if v, ok := data[field]; !ok || v == "" {
			logger.Error(
				"verifyOTPService: missing required field: ",
				err,
				logger.F("field", field),
			)
			if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
				logger.Error("verifyOTPService: release signup lock failed: ", err)
			}
			if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
				logger.Error("verifyOTPService: delete signup session failed: ", err)
			}
			return nil, apperrors.WrapAuth(autherror.ErrSessionCorrupted)
		}
	}

	attempts, err := strconv.Atoi(data["otp_attempts"])
	if err != nil {
		logger.Error(
			"verifyOTPService: invalid otp_attempts value: ",
			err,
			logger.F("value", data["otp_attempts"]),
		)
		return nil, apperrors.WrapAuth(autherror.ErrSessionCorrupted)
	}
	if attempts >= config.OTPAttempts {
		if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
			logger.Error("verifyOTPService: release signup lock failed: ", err)
		}
		if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
			logger.Error("verifyOTPService: delete signup session failed: ", err)
		}
		return nil, apperrors.WrapAuth(autherror.ErrTooManyAttempts)
	}

	if data["otp"] != otp {
		if _, err := s.redisHash.IncrementField(ctx, sessionKey, "otp_attempts", 1); err != nil {
			logger.Error("verifyOTPService: increment otp_attempts failed: ", err, logger.F("key", sessionKey))
		}
		return nil, apperrors.WrapAuth(autherror.ErrInvalidOTP)
	}

	otpExpiresAt, err := strconv.ParseInt(data["otp_expires_at"], 10, 64)
	if err != nil {
		logger.Error(
			"verifyOTPService: invalid otp_expires_at value: ",
			err,
			logger.F("value", data["otp_expires_at"]),
		)
		if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
			logger.Error("verifyOTPService: release signup lock failed: ", err)
		}
		if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
			logger.Error("verifyOTPService: delete signup session failed: ", err)
		}
		return nil, apperrors.WrapAuth(autherror.ErrSessionCorrupted)
	}

	if time.Now().Unix() > otpExpiresAt {
		return nil, apperrors.WrapAuth(autherror.ErrOTPExpired)
	}

	user, err := s.user.CreateUser(ctx,
		data["name"],
		data["email"],
		data["password"])
	if err != nil {
		logger.Error("verifyOTPService: mongoDB insert failed: ", err, logger.F("email", data["email"]))
		return nil, apperrors.ErrMongo
	}

	lockKey := "signup_lock:" + data["email"]

	if err := s.redisCommon.ReleaseLock(ctx, lockKey, sessionId); err != nil {
		logger.Error("verifyOTPService: release signup lock failed: ", err)
	}

	if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
		logger.Error("verifyOTPService: delete signup session failed: ", err)
	}

	return user, nil
}

func (s *AuthService) ResendOTPService(ctx context.Context, sessionId string) (*ResendOTPResponse, error) {
	sessionKey := "signup:" + sessionId
	data, err := s.redisHash.GetHash(ctx, sessionKey)
	if err != nil || len(data) == 0 {
		logger.Error("resendOTPService: failed to fetch signup session: ", err, logger.F("key", sessionKey))
		return nil, apperrors.WrapAuth(autherror.ErrSessionExpired)
	}

	reattempts, err := strconv.Atoi(data["otp_resend_attempts"])
	if err != nil {
		logger.Error(
			"resendOTPService: invalid otp_resend_attempts value: ",
			err,
			logger.F("value", data["otp_resend_attempts"]),
		)
		if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
			logger.Error("resendOTPService: release signup lock failed: ", err)
		}
		if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
			logger.Error("resendOTPService: delete signup session failed: ", err)
		}
		return nil, apperrors.WrapAuth(autherror.ErrSessionCorrupted)
	}
	if reattempts >= config.MaxOTPResendAttempts {
		if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
			logger.Error("resendOTPService: release signup lock failed: ", err)
		}
		if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
			logger.Error("resendOTPService: delete signup session failed: ", err)
		}
		return nil, apperrors.WrapAuth(autherror.ErrTooManyAttempts)
	}

	if next, ok := data["otp_resend_after"]; ok {
		nextResendAt, err := strconv.ParseInt(next, 10, 64)
		if err != nil {
			logger.Error(
				"resendOTPService: invalid otp_resend_after: ",
				err,
				logger.F("value", next),
			)
			if err := s.redisCommon.ReleaseLock(ctx, "signup_lock:"+data["email"], sessionId); err != nil {
				logger.Error("resendOTPService: release signup lock failed: ", err)
			}
			if err := s.redisCommon.DeleteStrict(ctx, sessionKey); err != nil {
				logger.Error("resendOTPService: delete signup session failed: ", err)
			}
			return nil, apperrors.WrapAuth(autherror.ErrSessionCorrupted)
		}
		if time.Now().Unix() < nextResendAt {
			return nil, apperrors.WrapAuth(autherror.ErrResendCooldown)
		}
	}

	newOTP := utils.GenerateOTP(6)

	err = s.redisHash.CreateORUpdateHashFieldStrict(ctx, sessionKey, "otp", newOTP)
	if err != nil {
		logger.Error("resendOTPService: otp update failed: ", err)
		return nil, apperrors.ErrRedis
	}
	_, err = s.redisHash.IncrementField(ctx, sessionKey, "otp_resend_attempts", 1)
	if err != nil {
		logger.Error("resendOTPService: failed to increment otp_resend_attempts: ", err, logger.F("key", sessionKey))
		return nil, apperrors.ErrRedis
	}
	nextResendAt := toStr(time.Now().Add(config.ResendCoolDown).Unix())
	err = s.redisHash.CreateORUpdateHashFieldStrict(
		ctx,
		sessionKey,
		"otp_resend_after",
		nextResendAt,
	)
	if err != nil {
		logger.Error("resendOTPService: failed to reset otp_resend_after: ", err)
		return nil, apperrors.ErrRedis
	}
	err = s.redisHash.CreateORUpdateHashFieldStrict(
		ctx,
		sessionKey,
		"otp_expires_at",
		toStr(time.Now().Add(config.OtpExpirationTime).Unix()),
	)
	if err != nil {
		logger.Error("resendOTPService: failed to reset otp_expires_at: ", err)
		return nil, apperrors.ErrRedis
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
		logger.Error("resendOTPService: marshal email event failed: ", err, logger.F("email", data["email"]))
		return nil, apperrors.ErrUtils
	}
	err = sqs.Send(
		ctx,
		sqs.GetClient(),
		awsConfig.SQSQueueURL,
		string(payload),
	)
	if err != nil {
		logger.Error("resendOTPService: SQS send failed: ", err)
		return nil, apperrors.ErrSQS
	}
	return &ResendOTPResponse{
		OTPResendAfter: nextResendAt,
	}, nil
}

func (s *AuthService) LogoutService(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	blackListKey := "blacklist:refresh:" + refreshToken

	if err := s.redisCommon.Blacklist(
		ctx,
		blackListKey,
		config.RefreshTokenTTL,
	); err != nil {
		logger.Error("logoutService: failed to blacklist refresh token", err)
	}
	return nil
}

func (s *AuthService) LoginService(ctx context.Context, req LoginRequest) (*model.User, error) {
	if req.Email == "" || req.Password == "" {
		logger.Error("loginService: email and password missing: ", nil)
		return nil, apperrors.WrapAuth(autherror.ErrInvalidCredentials)
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.user.Find(
		ctx,
		bson.M{"email": email},
	)
	if err != nil {

		if errors.Is(err, mongoerror.ErrNotFound) {
			return nil, apperrors.WrapAuth(autherror.ErrInvalidCredentials)
		}

		logger.Error(
			"loginService: failed to fetch user",
			err,
			logger.F("email", email),
		)
		return nil, apperrors.ErrMongo
	}

	return user, nil
}

func (s *AuthService) RefreshTokenService(ctx context.Context, refreshToken string) (*TokenPair, error) {
	blackListKey := "blacklist:refresh:" + refreshToken

	exists, err := s.redisCommon.Exists(ctx, blackListKey)
	if err != nil {
		logger.Error("refreshTokenService: check refresh token existence failed: ", err)
		return nil, apperrors.ErrRedis
	}
	if exists {
		return nil, apperrors.WrapAuth(autherror.ErrSessionExpired)
	}

	claims, err := utils.ValidateRefreshToken(refreshToken)
	if err != nil {
		if errors.Is(err, utilserror.ErrTokenExpired) {
			return nil, apperrors.WrapAuth(autherror.ErrRefreshTokenExpired)
		}
		logger.Error("refreshTokenService: refresh token validation failed: ", err)
		return nil, apperrors.WrapAuth(autherror.ErrInvalidToken)
	}
	newAccess, err := utils.GenerateAccessToken(claims.UserID)
	if err != nil {
		logger.Error("refreshTokenService: access token generation failed: ", err)
		return nil, apperrors.ErrUtils
	}
	newRefreshToken, err := utils.GenerateRefreshToken(claims.UserID)
	if err != nil {
		return nil, apperrors.ErrUtils
	}

	if err := s.redisCommon.Blacklist(
		ctx,
		blackListKey,
		config.RefreshTokenTTL,
	); err != nil {
		logger.Error("refreshTokenService: failed to blacklist refresh token: ", err)
	}

	return &TokenPair{
		AccessToken:  newAccess,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *AuthService) MeService(ctx context.Context, accessToken string) (*MeResponse, error) {
	accessClaims, err := utils.ValidateAccessToken(accessToken)
	if err != nil {
		if errors.Is(err, utilserror.ErrTokenExpired) {
			return nil, apperrors.WrapAuth(autherror.ErrAccessTokenExpired)
		}
		return nil, apperrors.WrapAuth(autherror.ErrUnauthorized)
	}
	objID, err := primitive.ObjectIDFromHex(accessClaims.UserID)
	if err != nil {
		logger.Error("meService: invalid user id:", err)
		return nil, apperrors.WrapAuth(autherror.ErrUnauthorized)
	}

	user, err := s.user.FindByID(ctx, objID)
	if err != nil {

		if errors.Is(err, mongoerror.ErrNotFound) {
			logger.Error("meService: user not found (refresh)", err)
			return nil, apperrors.WrapAuth(autherror.ErrUnauthorized)
		}

		logger.Error("meService: failed to fetch user (refresh)", err)
		return nil, apperrors.ErrMongo
	}

	return &MeResponse{
		Id:     user.ID.Hex(),
		Name:   user.Name,
		Email:  user.Email,
		Avatar: user.Avatar,
	}, nil
}
