package services

import (
	"linklab-server/repo"
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

func (c *RedisCommonService) ensureKeyExists(key string) error {
	if key == "" {
		return ErrKeyRequired
	}
	exists, err := c.repo.Exists(key)
	if err != nil {
		return err
	}

	if !exists {
		return ErrKeyNotFound
	}

	return nil
}

func (c *RedisCommonService) Exists(key string) (bool, error) {
	exists, err := c.repo.Exists(key)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (c *RedisCommonService) CountKeys(ds string) (int64, error) {
	return c.repo.CountKeys(ds)
}

func (c *RedisCommonService) Delete(key string) error {
	if err := c.ensureKeyExists(key); err != nil {
		return err
	}
	return c.repo.Delete(key)
}

func (c *RedisCommonService) GetTTL(key string) (int64, error) {
	if err := c.ensureKeyExists(key); err != nil {
		return 0, err
	}
	return c.repo.GetTTL(key)
}

func (c *RedisCommonService) SetTTL(key string, ttl time.Duration) error {
	if ttl <= 0 {
		return ErrTTL
	}
	if err := c.ensureKeyExists(key); err != nil {
		return err
	}
	return c.repo.SetTTL(key, ttl)
}
