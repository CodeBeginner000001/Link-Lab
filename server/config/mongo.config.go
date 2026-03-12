package config

import "log"

type MongoConfig struct {
	URI      string
	Database string

	ConnectTimeoutSeconds int
	MaxRetries            int
	RetryDelaySeconds     int
	CooldownSeconds       int
}

func LoadMongoConfig() MongoConfig {
	uri := GetEnv("MONGODB_URL", "")
	db := GetEnv("MONGO_DB", "dev")

	cfg := MongoConfig{
		URI:      uri,
		Database: db,

		ConnectTimeoutSeconds: GetEnvInt("MONGO_CONNECT_TIMEOUT_SECONDS", 5),
		MaxRetries:            GetEnvInt("MONGO_MAX_RETRIES", 5),
		RetryDelaySeconds:     GetEnvInt("MONGO_RETRY_DELAY_SECONDS", 2),
		CooldownSeconds:       GetEnvInt("MONGO_COOLDOWN_SECONDS", 30),
	}

	if !IsProd() {
		cfg.URI = "mongodb://localhost:27017"
		cfg.Database = "linklab"
	} else {
		if cfg.URI == "" {
			log.Fatal("MongoDB_URL is required in production and is missing: ")
		}
	}

	return cfg
}
