package hash

import (
	"context"
	"linklab-server/db"
	"linklab-server/errors/rediserror"
	"linklab-server/logger"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisHashRepository struct{}

func (r *RedisHashRepository) CreateHashIfNotExists(ctx context.Context,
	key string,
	fields map[string]string,
	ttl time.Duration,
) (bool, error) {
	if err := db.EnsureRedis(); err != nil {
		return false, rediserror.ErrRedisUnavailable
	}

	script := redis.NewScript(`
	if redis.call("EXISTS", KEYS[1]) == 1 then
		return 0
	end
	redis.call("HSET", KEYS[1], unpack(ARGV, 1, #ARGV - 1))
	redis.call("EXPIRE", KEYS[1], tonumber(ARGV[#ARGV]))
	return 1
`)

	args := make([]interface{}, 0, len(fields)*2+1)
	for k, v := range fields {
		args = append(args, k, v)
	}
	args = append(args, int(ttl.Seconds()))

	res, err := script.Run(ctx, db.RedisClient, []string{key}, args...).Int()
	if err != nil {
		logger.Error("redis CreateHashIfNotExists failed in hash repo: ", err)
		return false, rediserror.ErrRedisCommand
	}

	return res == 1, nil
}

func (r *RedisHashRepository) GetHash(ctx context.Context, key string) (map[string]string, error) {
	if err := db.EnsureRedis(); err != nil {
		return nil, rediserror.ErrRedisUnavailable
	}
	data, err := db.RedisClient.HGetAll(ctx, key).Result()
	if err != nil {
		logger.Error("redis GetHash failed in hash repo: ", err)
		return nil, rediserror.ErrRedisCommand
	}

	return data, nil
}

func (r *RedisHashRepository) IncrementHashField(
	ctx context.Context,
	key string,
	field string,
	by int64,
) (int64, error) {
	if err := db.EnsureRedis(); err != nil {
		return 0, rediserror.ErrRedisUnavailable
	}

	val, err := db.RedisClient.HIncrBy(ctx, key, field, by).Result()
	if err != nil {
		logger.Error("redis IncrementHashField failed in hash repo: ", err)
		return 0, rediserror.ErrRedisCommand
	}

	return val, nil
}

func (r *RedisHashRepository) CreateORUpdateHashField(ctx context.Context, key, field, value string) error {
	if err := db.EnsureRedis(); err != nil {
		return rediserror.ErrRedisUnavailable
	}
	if err:= db.RedisClient.HSet(ctx, key, field, value).Err(); err !=nil{
		logger.Error("redis CreateORUpdateHashField failed in hash repo: ", err)
		return rediserror.ErrRedisCommand
	}
	return nil
}

func (r *RedisHashRepository) HashFieldExists(ctx context.Context, key, field string) (bool, error) {
if err := db.EnsureRedis(); err != nil {
		return false, rediserror.ErrRedisUnavailable
	}
	exists, err := db.RedisClient.HExists(ctx, key, field).Result()
	if err != nil {
		logger.Error("redis HashFieldExists failed in hash repo: ", err)
		return false, rediserror.ErrRedisCommand
	}

	return exists, nil
}

func (r *RedisHashRepository) DeleteHashField(ctx context.Context, key, field string) error {
		if err := db.EnsureRedis(); err != nil {
		return rediserror.ErrRedisUnavailable
	}

	if err := db.RedisClient.HDel(ctx, key, field).Err(); err != nil {
		logger.Error("redis DeleteHashField failed in hash repo: ", err)
		return rediserror.ErrRedisCommand
	}

	return nil
}

func (r *RedisHashRepository) GetHashMeta(ctx context.Context, key string) (map[string]interface{}, error) {
	if err := db.EnsureRedis(); err != nil {
		return nil, rediserror.ErrRedisUnavailable
	}
	ttl, err := db.RedisClient.TTL(ctx, key).Result()
	if err != nil {
		logger.Error("redis GetHashMeta(TTL) failed in hash repo", err)
		return nil, rediserror.ErrRedisCommand
	}
	fieldCount, err := db.RedisClient.HLen(ctx, key).Result()
	if err != nil {
		logger.Error("redis GetHashMeta(HLen) failed in hash repo", err)
		return nil, rediserror.ErrRedisCommand
	}
	return map[string]interface{}{
		"ttl":         int64(ttl.Seconds()),
		"field_count": fieldCount,
	}, nil
}
