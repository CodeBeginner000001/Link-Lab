package services

import (
	"context"
	"linklab-server/modules/redis/repo"
	"time"
)

type RedisCommonService struct {
	repo *repo.RedisCommonRepo
}

func NewRedisCommonService() *RedisCommonService {
	return &RedisCommonService{
		repo: &repo.RedisCommonRepo{},
	}
}

func (c *RedisCommonService) ensureKeyExists(ctx context.Context, key string) error {
	if key == "" {
		return ErrKeyRequired
	}
	exists, err := c.repo.Exists(ctx, key)
	if err != nil {
		return err
	}

	if !exists {
		return ErrKeyNotFound
	}

	return nil
}

func (c *RedisCommonService) Exists(ctx context.Context, key string) (bool, error) {
	exists, err := c.repo.Exists(ctx, key)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (c *RedisCommonService) CountKeys(ctx context.Context, ds string) (int64, error) {
	return c.repo.CountKeys(ctx, ds)
}

func (c *RedisCommonService) Delete(ctx context.Context, key string) error {
	if err := c.ensureKeyExists(ctx, key); err != nil {
		return err
	}
	return c.repo.Delete(ctx, key)
}

func (c *RedisCommonService) GetTTL(ctx context.Context, key string) (int64, error) {
	if err := c.ensureKeyExists(ctx, key); err != nil {
		return 0, err
	}
	return c.repo.GetTTL(ctx, key)
}

func (c *RedisCommonService) SetTTL(ctx context.Context, key string, ttl time.Duration) error {
	if ttl <= 0 {
		return ErrTTL
	}
	if err := c.ensureKeyExists(ctx, key); err != nil {
		return err
	}
	return c.repo.SetTTL(ctx, key, ttl)
}
