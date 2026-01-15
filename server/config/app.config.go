package config

import "time"

func IsProduction() bool {
	return false
}

const (
	Env      = "dev"
	LogLevel = "info"

	OTPAttempts       = 5
	OtpExpirationTime = 1 * time.Minute
	SignupSessionTTL  = 15 * time.Minute
)

var (
	JWTAccessSecret  = []byte("djkfvdbvk2323j3232k2d")
	JWTRefreshSecret = []byte("djkvdvkdvkd2342dww23e")

	AccessTokenTTL  = 15 * time.Minute
	RefreshTokenTTL = 30 * 24 * time.Hour
)
