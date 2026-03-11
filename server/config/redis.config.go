package config

import "time"

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
	TTL      time.Duration

	ConnectTimeoutSeconds int
	MaxRetries            int
	RetryDelaySeconds     int
	CooldownSeconds       int

	UpStashURL string
}

func LoadRedisConfig() RedisConfig {
	cfg := RedisConfig {
		Host: GetEnv("REDIS_HOST", "localhost"),
		Port: GetEnv("REDIS_PORT", "6379"),
		Password: GetEnv("REDIS_PASSWORD",""),
		DB: GetEnvInt("REDIS_DB", 0),
		TTL: time.Duration(GetEnvInt("REDIS_TTL_HOURS", 1)) * time.Hour,

		ConnectTimeoutSeconds: GetEnvInt("REDIS_CONNECT_TIMEOUT_SECONDS", 5),
		MaxRetries: GetEnvInt("REDIS_MAX_RETRIES", 5),
		RetryDelaySeconds: GetEnvInt("REDIS_RETRY_DELAY_SECONDS", 2),
		CooldownSeconds: GetEnvInt("REDIS_COOLDOWN_SECONDS", 30),

		UpStashURL: GetEnv("UPSTASH_REDIS_URL", ""),
	}
	if IsProd() && cfg.UpStashURL != "" {
		cfg.Host=""
		cfg.Port=""
		cfg.Password=""
		cfg.DB = 0
	}
	return cfg
}
