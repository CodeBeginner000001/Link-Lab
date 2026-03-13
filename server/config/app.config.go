package config

import (
	"os"
	"time"
)

var (
	Env      = "dev"
	LogLevel = "info"

	OTPAttempts          = 2
	MaxOTPResendAttempts = 2
	ResendCoolDown       = 5 * time.Second
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

func InitAppConfig() {
	Env = GetEnv("ENV", "dev")
	LogLevel = GetEnv("LOG_LEVEL", "info")

	JWTAccessSecret = []byte(GetEnv("JWT_ACCESS_SECRET", string(JWTAccessSecret)))
	JWTRefreshSecret = []byte(GetEnv("JWT_REFRESH_SECRET", string(JWTRefreshSecret)))

	AccessTokenTTL = time.Duration(GetEnvInt("ACCESS_TOKEN_TTL_MINUTES", 15)) * time.Minute
	RefreshTokenTTL = time.Duration(GetEnvInt("REFRESH_TOKEN_TTL_HOURS", 30*24)) * time.Hour
}

func IsProduction() bool {
	vercelEnv := os.Getenv("VERCEL_ENV")
	return Env == "prod" || vercelEnv == "preview" || vercelEnv == "production"
}
