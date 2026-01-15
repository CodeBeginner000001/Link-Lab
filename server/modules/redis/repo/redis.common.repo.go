package repo

import (
	"linklab-server/db"
	"time"
)

type RedisCommonRepo struct{}

func (r *RedisCommonRepo) Exists(key string) (bool, error) {
	count, err := db.RedisClient.Exists(db.Ctx, key).Result()
	return count == 1, err
}

func (r *RedisCommonRepo) CountKeys(ds string) (int64, error) {
	var (
		cursor uint64
		count  int64
	)
	for {
		keys, nextCursor, err := db.RedisClient.Scan(db.Ctx, cursor, "*", 1000).Result()
		if err != nil {
			return 0, err
		}
		for _, key := range keys {
			t, err := db.RedisClient.Type(db.Ctx, key).Result()
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

func (r *RedisCommonRepo) Delete(key string) error {
	return db.RedisClient.Del(db.Ctx, key).Err()
}

func (r *RedisCommonRepo) GetTTL(key string) (int64, error) {
	ttl, err := db.RedisClient.TTL(db.Ctx, key).Result()
	if err != nil {
		return 0, err
	}
	return int64(ttl.Seconds()), nil
}

func (r *RedisCommonRepo) SetTTL(key string, ttl time.Duration) error {
	return db.RedisClient.Expire(db.Ctx, key, ttl).Err()
}
