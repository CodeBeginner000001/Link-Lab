package config

import "time"

func IsProduction() bool {
	return false
}

const (
	Env      = "dev"
	LogLevel = "info"

	OTPAttempts          = 10
	MaxOTPResendAttempts = 5
	ResendCoolDown       = 10 * time.Second
	OtpExpirationTime    = 1 * time.Minute
	SignupSessionTTL     = 5 * time.Minute
	ForgotPasswordTTL    = 10 * time.Minute
)

var (
	JWTAccessSecret  = []byte("djkfvdbvk2323j3232k2d")
	JWTRefreshSecret = []byte("djkvdvkdvkd2342dww23e")

	AccessTokenTTL  = 15 * time.Minute
	RefreshTokenTTL = 30 * 24 * time.Hour
)
