package db

import (
	"context"
	"fmt"
	"linklab-server/config"
	"log"

	"github.com/redis/go-redis/v9"
)

var (
	Ctx         = context.Background()
	RedisClient *redis.Client
)

func ConnectRedis() {
	cfg := config.LoadRedisConfig()
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Fatal("❌ Redis connection failed:", err)
	}
	log.Println("✅ Redis connected successfully")
}
