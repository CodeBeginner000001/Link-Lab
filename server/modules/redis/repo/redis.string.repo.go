package repo

import (
	"linklab-server/db"
	"time"
)

type RedisStringRepo struct{}

func (r *RedisStringRepo) CreateString(key string, value string, ttl time.Duration) error {
	if ttl > 0 {
		return db.RedisClient.Set(db.Ctx, key, value, ttl).Err()
	}
	return db.RedisClient.Set(db.Ctx, key, value, 0).Err()
}

func (r *RedisStringRepo) GetString(key string) (string, error) {
	return db.RedisClient.Get(db.Ctx, key).Result()
}

func (r *RedisStringRepo) AppendString(key string, value string) (int64, error) {
	return db.RedisClient.Append(db.Ctx, key, value).Result()
}

func (r *RedisStringRepo) StringLength(key string) (int64,error) {
	return db.RedisClient.StrLen(db.Ctx, key).Result()
}
