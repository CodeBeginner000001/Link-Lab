package common

import (
	"context"
	"linklab-server/db"
	"linklab-server/errors/rediserror"
	"linklab-server/logger"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCommonRepo struct{}

var releaseLockScript = redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
end
return 0
`)

func (r *RedisCommonRepo) ReleaseLock(
	ctx context.Context,
	key string,
	value string,
) (bool, error) {
	if err := db.EnsureRedis(); err != nil {
		return false, rediserror.ErrRedisUnavailable
	}

	res, err := releaseLockScript.Run(
		ctx,
		db.RedisClient,
		[]string{key},
		value,
	).Result()

	if err != nil {
		logger.Error("redis ReleaseLock failed in common repo: ", err)
		return false, rediserror.ErrRedisCommand
	}
	deleted, ok := res.(int64)
	if !ok {
		return false, rediserror.ErrRedisCommand
	}

	return deleted == 1, nil
}

func (r *RedisCommonRepo) SetNX(
	ctx context.Context,
	key, value string,
	ttl time.Duration,
) (bool, error) {
	if err := db.EnsureRedis(); err != nil {
		return false, rediserror.ErrRedisUnavailable
	}

	ok, err := db.RedisClient.SetNX(ctx, key, value, ttl).Result()

	if err != nil {
		logger.Error("redis SetNX failed in common repo: ", err)
		return false, rediserror.ErrRedisCommand
	}
	return ok, nil
}

func (r *RedisCommonRepo) Delete(ctx context.Context, key string) (bool, error) {
	if err := db.EnsureRedis(); err != nil {
		return false, rediserror.ErrRedisUnavailable
	}
	count, err := db.RedisClient.Del(ctx, key).Result()
	if err != nil {
		logger.Error("redis Delete failed in common repo: ", err)
		return false, rediserror.ErrRedisCommand
	}
	return count > 0, nil
}

func (r *RedisCommonRepo) Exists(ctx context.Context, key string) (bool, error) {
	if err := db.EnsureRedis(); err != nil {
		return false, rediserror.ErrRedisUnavailable
	}

	count, err := db.RedisClient.Exists(ctx, key).Result()

	if err != nil {
		logger.Error("redis Exists failed in common repo: ", err)
		return false, rediserror.ErrRedisCommand
	}
	return count > 0, nil
}

func (r *RedisCommonRepo) CountKeys(ctx context.Context, ds string) (int64, error) {
	if err := db.EnsureRedis(); err != nil {
		return 0, rediserror.ErrRedisUnavailable
	}
	var (
		cursor uint64
		count  int64
	)
	for {
		keys, nextCursor, err := db.RedisClient.Scan(ctx, cursor, "*", 1000).Result()
		if err != nil {
			logger.Error("redis Scan failed in common repo: ", err)
			return 0, rediserror.ErrRedisCommand
		}
		for _, key := range keys {
			t, err := db.RedisClient.Type(ctx, key).Result()
			if err != nil {
				logger.Error("redis TYPE failed in common repo", err, logger.F("key", key))
				return 0, rediserror.ErrRedisCommand
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

func (r *RedisCommonRepo) GetTTL(ctx context.Context, key string) (time.Duration, error) {
	if err := db.EnsureRedis(); err != nil {
		return 0, rediserror.ErrRedisUnavailable
	}
	ttl, err := db.RedisClient.TTL(ctx, key).Result()
	if err != nil {
		logger.Error("redis TTL failed in common repo: ", err)
		return 0, rediserror.ErrRedisCommand
	}

	return ttl, nil
}

func (r *RedisCommonRepo) SetTTL(ctx context.Context, key string, ttl time.Duration) error {
	if err := db.EnsureRedis(); err != nil {
		return rediserror.ErrRedisUnavailable
	}
	if err := db.RedisClient.Expire(ctx, key, ttl).Err(); err != nil {
		logger.Error("redis Expire failed in common repo: ", err)
		return rediserror.ErrRedisCommand
	}

	return nil
}
