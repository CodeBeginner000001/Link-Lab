package config

import "time"

type RedisConfig struct {
	Host string
	Port string
	Password string
	DB int
	TTL time.Duration

	ConnectTimeoutSeconds int
	MaxRetries            int
	RetryDelaySeconds     int
	CooldownSeconds       int
}

func LoadRedisConfig() RedisConfig {
	return RedisConfig{
		Host: "localhost",
		Port: "6379",
		Password: "",
		DB: 0,
	    TTL: time.Hour,

		ConnectTimeoutSeconds: 5,
		MaxRetries:            5,
		RetryDelaySeconds:     2,
		CooldownSeconds:       30,
	}
}