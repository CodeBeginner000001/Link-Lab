package db

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"

	"linklab-server/config"
	"linklab-server/logger"

	"github.com/redis/go-redis/v9"
)

var (
	RedisClient  *redis.Client
	redisHealthy atomic.Bool
)

func newRedisClient(cfg config.RedisConfig) (*redis.Client, error) {
	if config.IsProd() && cfg.UpStashURL != "" {
		opt, err := redis.ParseURL(cfg.UpStashURL)
		if err != nil {
			return nil, fmt.Errorf("Invalid upstash redis url: %w", err)
		}
		opt.DialTimeout = time.Duration(cfg.ConnectTimeoutSeconds) * time.Second
		opt.ReadTimeout = 3 * time.Second
		opt.WriteTimeout = 3 * time.Second
		opt.PoolTimeout = 4 * time.Second

		return redis.NewClient(opt), nil
	}
	return redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  time.Duration(cfg.ConnectTimeoutSeconds) * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolTimeout:  4 * time.Second,
	}), nil
}

func ConnectRedis() error {
	cfg := config.LoadRedisConfig()
	maxRetries := cfg.MaxRetries
	if config.IsServerless() && maxRetries > 1 {
		maxRetries = 1
	}
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		logger.Info(fmt.Sprintf("🔄 Redis connection attempt %d/%d", attempt, maxRetries))

		client, err := newRedisClient(cfg)
		if err != nil {
			lastErr = err
			logger.Error("❌ Redis client setup failed: ", err)
			if attempt < maxRetries {
				time.Sleep(time.Duration(cfg.RetryDelaySeconds) * time.Second)
			}
			continue
		}

		ctx, cancel := context.WithTimeout(
			context.Background(),
			time.Duration(cfg.ConnectTimeoutSeconds)*time.Second,
		)

		err = client.Ping(ctx).Err()
		cancel()

		if err == nil {
			RedisClient = client
			redisHealthy.Store(true)
			if config.IsProd() && cfg.UpStashURL != "" {
				logger.Info("✅ Upstash Redis connected successfully")
			} else {
				logger.Info("✅ Local Redis connected successfully")
			}
			return nil
		}

		lastErr = err
		_ = client.Close()
		logger.Error("❌ Redis connection failed: ", err)
		if attempt < maxRetries {
			time.Sleep(time.Duration(cfg.RetryDelaySeconds) * time.Second)
		}
	}

	redisHealthy.Store(false)
	return fmt.Errorf("Redis connection failed after %d attempt(s): %w", maxRetries, lastErr)
}

func IsRedisHealthy() bool {
	return redisHealthy.Load()
}

func MonitorRedis() {
	cfg := config.LoadRedisConfig()
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if RedisClient == nil {
			redisHealthy.Store(false)
			continue
		}

		ctx, cancel := context.WithTimeout(
			context.Background(),
			time.Duration(cfg.ConnectTimeoutSeconds)*time.Second,
		)

		err := RedisClient.Ping(ctx).Err()
		cancel()

		if err != nil {
			if redisHealthy.Load() {
				logger.Warn("⚠️ Redis became unavailable, reconnecting...")
			}
			redisHealthy.Store(false)
			if reconnectErr := ConnectRedis(); reconnectErr != nil {
				logger.Error("Redis reconnect failed", reconnectErr)
			}
			continue
		}

		if !redisHealthy.Load() {
			logger.Info("✅ Redis connection restored")
		}

		redisHealthy.Store(true)
	}
}
