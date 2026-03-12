package db

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"

	"linklab-server/config"
	"linklab-server/logger"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	MongoClient  *mongo.Client
	MongoDB      *mongo.Database
	mongoHealthy atomic.Bool
)

func GetMongoSourceURI(cfg config.MongoConfig) string {
	if !config.IsProd() {
		return cfg.URI
	}
	return "prod uri can't be exposed"
}

func ConnectMongo() error {
	cfg := config.LoadMongoConfig()
	maxRetries := cfg.MaxRetries
	if config.IsServerless() && maxRetries > 1 {
		maxRetries = 1
	}
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		logger.Info("🔄 MongoDB connection attempt", logger.F("Attempt", attempt), logger.F("Max retries", maxRetries))
		ctx, cancel := context.WithTimeout(
			context.Background(),
			time.Duration(cfg.ConnectTimeoutSeconds)*time.Second,
		)

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.URI))
		if err == nil {
			err = client.Ping(ctx, nil)
		}

		cancel()

		if err == nil {
			MongoClient = client
			MongoDB = client.Database(cfg.Database)
			mongoHealthy.Store(true)
			logger.Info("📦 Mongo connection source", logger.F("source: ", GetMongoSourceURI(cfg)))
			logger.Info("✅ MongoDB connected")
			return nil
		}

		lastErr = err
		logger.Error("❌ MongoDB connection failed:", err)
		if attempt < maxRetries {
			time.Sleep(time.Duration(cfg.RetryDelaySeconds) * time.Second)
		}
	}

	mongoHealthy.Store(false)
	return fmt.Errorf("MongoDB connection failed after %d attempt(s): %w", maxRetries, lastErr)
}

func IsMongoHealthy() bool {
	return mongoHealthy.Load()
}

func MonitorMongo() {
	cfg := config.LoadMongoConfig()
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if MongoClient == nil {
			mongoHealthy.Store(false)
			continue
		}

		ctx, cancel := context.WithTimeout(
			context.Background(),
			time.Duration(cfg.ConnectTimeoutSeconds)*time.Second,
		)

		err := MongoClient.Ping(ctx, nil)
		cancel()

		if err != nil {
			if mongoHealthy.Load() {
				logger.Warn("⚠️ MongoDB became unavailable, reconnecting...")
			}
			mongoHealthy.Store(false)
			if reconnectErr := ConnectMongo(); reconnectErr != nil {
				logger.Error("MongoDB reconnect failed", reconnectErr)
			}
			continue
		}

		if !mongoHealthy.Load() {
			logger.Info("✅ MongoDB connection restored")
		}

		mongoHealthy.Store(true)
	}
}
