package repo

import (
	"context"
	"linklab-server/db"
	"time"
)

type RedisHashRepository struct{}

func (r *RedisHashRepository) CreateHash(ctx context.Context,
	key string,
	fields map[string]string,
	ttl time.Duration,
) error {
	if err := db.RedisClient.HSet(
		ctx,
		key,
		fields,
	).Err(); err != nil {
		return err
	}
	if ttl > 0 {
		return db.RedisClient.Expire(
			ctx,
			key,
			ttl,
		).Err()
	}
	return nil

}

func (r *RedisHashRepository) GetHash(ctx context.Context,key string) (map[string]string, error) {
	return db.RedisClient.HGetAll(ctx, key).Result()
}

func (r *RedisHashRepository) HashFieldExists(ctx context.Context,key, field string) (bool, error) {
	return db.RedisClient.HExists(ctx, key, field).Result()
}

func (r *RedisHashRepository) DeleteHashField(ctx context.Context,key, field string) error {
	return db.RedisClient.HDel(ctx, key, field).Err()
}

func (r *RedisHashRepository) CreateORUpdateHashField(ctx context.Context,key, field, value string) error {
	return db.RedisClient.HSet(ctx, key, field, value).Err()
}

func (r *RedisHashRepository) GetHashMeta(ctx context.Context, key string) (map[string]interface{}, error) {
	ttl, err := db.RedisClient.TTL(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	fieldCount, err := db.RedisClient.HLen(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"ttl":         int64(ttl.Seconds()),
		"field_count": fieldCount,
	}, nil
}
