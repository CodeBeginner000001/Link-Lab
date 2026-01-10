package config

import "time"

type RedisConfig struct {
	Host string
	Port string
	Password string
	DB int
	TTL time.Duration
}

func LoadRedisConfig() RedisConfig {
	return RedisConfig{
		Host: "localhost",
		Port: "6379",
		Password: "",
		DB: 0,
	    TTL: time.Hour,
	}
}