package services

import (
	"context"
	"linklab-server/modules/redis/repo"
	"time"
)

type RedisHashService struct { // Service struct that holds required dependencies (currently only one)
	repo   *repo.RedisHashRepository // Avoid copying repo and allow shared state
	common *RedisCommonService
}

func NewRedisHashService() *RedisHashService { // Constructor that creates and returns a fully initialized service
	return &RedisHashService{ // return its memory address and create a new service
		repo:   &repo.RedisHashRepository{}, // Initialize repository and inject it into the service
		common: NewRedisCommonService(),
	}
}

func (s *RedisHashService) CreateHash(
	ctx context.Context,
	key string,
	fields map[string]string,
	ttl time.Duration,
) error {
	exists, err := s.common.Exists(ctx, key)
	if err != nil {
		return err
	}
	if exists {
		return ErrKeyAlreadyExists
	}
	return s.repo.CreateHash(ctx, key, fields, ttl)
}

func (s *RedisHashService) GetHash(ctx context.Context, key string) (map[string]string, error) {
	if err := s.common.ensureKeyExists(ctx, key); err != nil {
		return nil, err
	}
	return s.repo.GetHash(ctx, key)
}

func (s *RedisHashService) UpdateHash(ctx context.Context, key string, fields map[string]string) error {
	if err := s.common.ensureKeyExists(ctx, key); err != nil {
		return err
	}
	return s.repo.CreateHash(ctx, key, fields, 0)
}

func (s *RedisHashService) HashFieldExists(ctx context.Context, key, field string) (bool, error) {
	if err := s.common.ensureKeyExists(ctx, key); err != nil {
		return false, err
	}
	exists, err := s.repo.HashFieldExists(ctx, key, field)
	if err != nil {
		return false, err
	}

	if !exists {
		return false, ErrFieldNotFound
	}

	return true, nil
}

func (s *RedisHashService) DeleteHashField(ctx context.Context, key, field string) error {
	if _, err := s.HashFieldExists(ctx, key, field); err != nil {
		return err
	}
	return s.repo.DeleteHashField(ctx, key, field)
}

func (s *RedisHashService) CreateORUpdateHashField(ctx context.Context, key, field, value string) error {
	if err := s.common.ensureKeyExists(ctx, key); err != nil {
		return err
	}
	return s.repo.CreateORUpdateHashField(ctx, key, field, value)
}

func (s *RedisHashService) GetHashMeta(ctx context.Context, key string) (map[string]interface{}, error) {
	if err := s.common.ensureKeyExists(ctx, key); err != nil {
		return nil, err
	}
	meta, err := s.repo.GetHashMeta(ctx, key)
	if err != nil {
		return nil, err
	}
	return meta, nil
}
