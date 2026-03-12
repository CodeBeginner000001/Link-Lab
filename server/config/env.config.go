package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found, using system environment variables: %v", err)
	}
}

func GetEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func GetEnvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return intValue
}

func IsProd() bool {
	env := strings.ToLower(GetEnv("ENV", "dev"))
	return env == "prod" || env == "production" || os.Getenv("VERCEL") == "1"
}

func IsServerless() bool {
	return os.Getenv("VERCEL") == "1"
}
