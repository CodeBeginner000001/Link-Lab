package repo

import (
	"linklab-server/db"
	"time"
)

type RedisHashRepository struct{}

func (r *RedisHashRepository) CreateHash(
	key string,
	fields map[string]string,
	ttl time.Duration,
) error {
	if err := db.RedisClient.HSet(
		db.Ctx,
		key,
		fields,
	).Err(); err != nil {
		return err
	}
	if ttl > 0 {
		return db.RedisClient.Expire(
			db.Ctx,
			key,
			ttl,
		).Err()
	}
	return nil

}

func (r *RedisHashRepository) GetHash(key string) (map[string]string, error) {
	return db.RedisClient.HGetAll(db.Ctx, key).Result()
}

func (r *RedisHashRepository) HashFieldExists(key, field string) (bool, error) {
	return db.RedisClient.HExists(db.Ctx, key, field).Result()
}

func (r *RedisHashRepository) DeleteHashField(key, field string) error {
	return db.RedisClient.HDel(db.Ctx, key, field).Err()
}

func (r *RedisHashRepository) CreateORUpdateHashField(key, field, value string) error {
	return db.RedisClient.HSet(db.Ctx, key, field, value).Err()
}

func (r *RedisHashRepository) GetHashMeta(key string) (map[string]interface{}, error) {
	ttl, err := db.RedisClient.TTL(db.Ctx, key).Result()
	if err != nil {
		return nil, err
	}
	fieldCount,err := db.RedisClient.HLen(db.Ctx, key).Result()
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"ttl": int64(ttl.Seconds()),
		"field_count": fieldCount,
	},nil
}

