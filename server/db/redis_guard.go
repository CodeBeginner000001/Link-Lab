package db

import "linklab-server/errors/rediserror"

func EnsureRedis() error {
	if !IsRedisHealthy() || RedisClient == nil {
		return rediserror.ErrRedisUnavailable
	}
	return nil
}
