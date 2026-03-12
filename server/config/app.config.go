package config

import "time"

type AppConfig struct {
	Env      string
	LogLevel string

	OTPAttempts          int
	MaxOTPResendAttempts int

	ResendCoolDown    time.Duration
	OtpExpirationTime time.Duration
	SignupSessionTTL  time.Duration
	ForgotPasswordTTL time.Duration

	JWTAccessSecret  []byte
	JWTRefreshSecret []byte
	AccessTokenTTL   time.Duration
	RefreshTokenTTL  time.Duration
}

func LoadAppConfig() AppConfig {
	return AppConfig{
		Env:      GetEnv("ENV", "dev"),
		LogLevel: GetEnv("LOG_LEVEL", "info"),

		OTPAttempts:          GetEnvInt("OTP_ATTEMPTS", 2),
		MaxOTPResendAttempts: GetEnvInt("MAX_OTP_RESEND_ATTEMPTS", 2),

		ResendCoolDown:    time.Duration(GetEnvInt("RESEND_COOLDOWN_SECONDS", 5)) * time.Second,
		OtpExpirationTime: time.Duration(GetEnvInt("OTP_EXPIRATION_SECONDS", 60)) * time.Second,
		SignupSessionTTL:  time.Duration(GetEnvInt("SIGNUP_SESSION_TTL_SECONDS", 300)) * time.Second,
		ForgotPasswordTTL: time.Duration(GetEnvInt("FORGOT_PASSWORD_TTL_SECONDS", 600)) * time.Second,

		JWTAccessSecret:  []byte(GetEnv("JWT_ACCESS_SECRET", "devbbkj78Daccessbhj78secret")),
		JWTRefreshSecret: []byte(GetEnv("JWT_REFRESH_SECRET", "devDDRb7723refresh7790Wsecret")),

		AccessTokenTTL:  time.Duration(GetEnvInt("ACCESS_TOKEN_TTL_SECONDS", 900)) * time.Second,
		RefreshTokenTTL: time.Duration(GetEnvInt("REFRESH_TOKEN_TTL_SECONDS", 604800)) * time.Second,
	}
}
