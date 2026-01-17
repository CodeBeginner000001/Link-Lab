package repo

import (
	"context"
	"linklab-server/db"
	"time"
)

type RedisStringRepo struct{}

func (r *RedisStringRepo) CreateString(ctx context.Context, key string, value string, ttl time.Duration) error {
	if ttl > 0 {
		return db.RedisClient.Set(ctx, key, value, ttl).Err()
	}
	return db.RedisClient.Set(ctx, key, value, 0).Err()
}

func (r *RedisStringRepo) GetString(ctx context.Context,key string) (string, error) {
	return db.RedisClient.Get(ctx, key).Result()
}

func (r *RedisStringRepo) AppendString(ctx context.Context,key string, value string) (int64, error) {
	return db.RedisClient.Append(ctx, key, value).Result()
}

func (r *RedisStringRepo) StringLength(ctx context.Context,key string) (int64, error) {
	return db.RedisClient.StrLen(ctx, key).Result()
}
