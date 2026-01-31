package common

import (
	"context"
	apperrors "linklab-server/errors"
	"linklab-server/errors/rediserror"
	"linklab-server/logger"
	"time"
)

type RedisCommonService struct {
	repo *RedisCommonRepo
}

func NewRedisCommonService() *RedisCommonService {
	return &RedisCommonService{
		repo: &RedisCommonRepo{},
	}
}

func (c *RedisCommonService) AcquireLock(
	ctx context.Context,
	key, value string,
	ttl time.Duration,
) (bool, error) {
	if key == "" {
		return false, apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if value == "" {
		return false, apperrors.WrapRedis(rediserror.ErrValueRequired)
	}
	if ttl <= 0 {
		return false, apperrors.WrapRedis(rediserror.ErrTTL)
	}
	locked, err := c.repo.SetNX(ctx, key, value, ttl)
	if err != nil {
		logger.Error("acquireLock: SetNX repo failed: ", err)
		return false, apperrors.WrapRedis(err)
	}

	return locked, nil
}

func (c *RedisCommonService) ReleaseLock(
	ctx context.Context,
	key string,
	value string,
) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if value == "" {
		return apperrors.WrapRedis(rediserror.ErrValueRequired)
	}
	released, err := c.repo.ReleaseLock(ctx, key, value)
	if err != nil {
		logger.Error("releaseLock: ReleaseLock repo failed: ", err)
		return apperrors.WrapRedis(err)
	}
	if !released {
		return apperrors.WrapRedis(rediserror.ErrLockNotOwned)
	}

	return nil

}

func (c *RedisCommonService) Exists(ctx context.Context, key string) (bool, error) {
	if key == "" {
		return false, apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	exists, err := c.repo.Exists(ctx, key)
	if err != nil {
		logger.Error("Exists: repo failed:", err)
		return false, apperrors.WrapRedis(err)
	}

	return exists, nil
}

func (c *RedisCommonService) EnsureKeyExists(ctx context.Context, key string) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	exists, err := c.repo.Exists(ctx, key)
	if err != nil {
		logger.Error("ensureKeyExists: Exists repo failed:", err)
		return apperrors.WrapRedis(err)
	}

	if !exists {
		return apperrors.WrapRedis(rediserror.ErrKeyNotFound)
	}

	return nil
}

func (c *RedisCommonService) DeleteStrict(ctx context.Context, key string) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	deleted, err := c.repo.Delete(ctx, key)
	if err != nil {
		logger.Error("deleteStrict: Delete repo failed: ", err)
		return apperrors.WrapRedis(err)
	}
	if !deleted {
		return apperrors.WrapRedis(rediserror.ErrKeyNotFound)
	}

	return nil
}

func (c *RedisCommonService) DeleteIfExists(ctx context.Context, key string) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	_, err := c.repo.Delete(ctx, key)
	logger.Error("deleteIfExists: Delete repo failed: ", err)
	return apperrors.WrapRedis(err)
}

func (c *RedisCommonService) GetTTL(ctx context.Context, key string) (int64, error) {
	if err := c.EnsureKeyExists(ctx, key); err != nil {
		return 0, err
	}
	if key == "" {
		return 0, apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}

	ttl, err := c.repo.GetTTL(ctx, key)
	if err != nil {
		logger.Error("getTTL: GetTTL repo failed: ", err)
		return 0, apperrors.WrapRedis(err)
	}

	switch ttl {
	case -2:
		return 0, apperrors.WrapRedis(rediserror.ErrKeyNotFound)
	case -1:
		return 0, apperrors.WrapRedis(rediserror.ErrKeyNoTTL)
	default:
		return int64(ttl.Seconds()), nil
	}
}

func (c *RedisCommonService) SetTTL(ctx context.Context, key string, ttl time.Duration) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}

	if ttl <= 0 {
		return apperrors.WrapRedis(rediserror.ErrTTL)
	}
	if err := c.EnsureKeyExists(ctx, key); err != nil {
		return err
	}
	if err := c.repo.SetTTL(ctx, key, ttl); err != nil {
		logger.Error("setTTL: SetTTL repo failed: ", err)
		return apperrors.WrapRedis(err)
	}

	return nil
}

func (c *RedisCommonService) Blacklist(
	ctx context.Context,
	key string,
	ttl time.Duration,
) error {

	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if ttl <= 0 {
		return apperrors.WrapRedis(rediserror.ErrTTL)
	}

	ok, err := c.repo.SetNX(ctx, key, "1", ttl)
	if err != nil {
		logger.Error("blacklist: SetNX repo failed:", err)
		return apperrors.WrapRedis(err)
	}
	if !ok {
		return apperrors.WrapRedis(rediserror.ErrKeyAlreadyExists)
	}

	return nil
}

func (c *RedisCommonService) CountKeys(ctx context.Context, ds string) (int64, error) {
	if ds == "" {
		return 0, apperrors.WrapRedis(rediserror.ErrValueRequired)
	}

	count, err := c.repo.CountKeys(ctx, ds)
	if err != nil {
		logger.Error("countKeys: CountKeys repo failed: ", err)
		return 0, apperrors.WrapRedis(err)
	}

	return count, nil
}