package config

import "log"

type MongoConfig struct {
	URI      string
	Database string
}

func LoadMongoConfig() MongoConfig {
	uri := "mongodb://localhost:27017"
	db := "linklab"

	if uri == "" || db == "" {
		log.Fatal("Mongo env variables not set")
	}
	return MongoConfig{
		URI:      uri,
		Database: db,
	}
}
