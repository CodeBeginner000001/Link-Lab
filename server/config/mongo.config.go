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
	uri := "mongodb://localhost:27017"
	db := "linklab"

	cfg := MongoConfig{
		URI:      uri,
		Database: db,

		ConnectTimeoutSeconds: 5,
		MaxRetries:            5,
		RetryDelaySeconds:     2,
		CooldownSeconds:       30,
	}

	if cfg.URI == "" || cfg.Database == "" {
		log.Fatal("Mongo configuration not set")
	}

	return cfg
}
