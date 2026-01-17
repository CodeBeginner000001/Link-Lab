package repo

import (
	"context"
	"linklab-server/db"
	"time"
)

type RedisCommonRepo struct{}

func (r *RedisCommonRepo) Exists(ctx context.Context, key string) (bool, error) {
	count, err := db.RedisClient.Exists(ctx, key).Result()
	return count == 1, err
}

func (r *RedisCommonRepo) CountKeys(ctx context.Context, ds string) (int64, error) {
	var (
		cursor uint64
		count  int64
	)
	for {
		keys, nextCursor, err := db.RedisClient.Scan(ctx, cursor, "*", 1000).Result()
		if err != nil {
			return 0, err
		}
		for _, key := range keys {
			t, err := db.RedisClient.Type(ctx, key).Result()
			if err != nil {
				return 0, err
			}
			if t == ds {
				count++
			}
		}
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
	return count, nil
}

func (r *RedisCommonRepo) Delete(ctx context.Context, key string) error {
	return db.RedisClient.Del(ctx, key).Err()
}

func (r *RedisCommonRepo) GetTTL(ctx context.Context, key string) (int64, error) {
	ttl, err := db.RedisClient.TTL(ctx, key).Result()
	if err != nil {
		return 0, err
	}
	switch ttl {
	case -2:
		return -2, nil
	case -1:
		return -1, nil
	default:
		return int64(ttl.Seconds()), nil
	}
}

func (r *RedisCommonRepo) SetTTL(ctx context.Context, key string, ttl time.Duration) error {
	return db.RedisClient.Expire(ctx, key, ttl).Err()
}
