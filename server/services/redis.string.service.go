package services

import (
	"linklab-server/repo"
	"time"
)

type RedisStringService struct { // Service struct that holds required dependencies (currently only one)
	repo   *repo.RedisStringRepo // Avoid copying repo and allow shared state
	common *RedisCommonService
}

func NewRedisStringService() *RedisStringService { // Constructor that creates and returns a fully initialized service
	return &RedisStringService{ // return its memory address and create a new service
		repo:   &repo.RedisStringRepo{}, // Initialize repository and inject it into the service
		common: NewRedisCommonService(),
	}
}

func (s *RedisStringService) CreateString(key string, value string, ttl time.Duration) error {
	exists, err := s.common.Exists(key)
	if err != nil {
		return err
	}
	if exists {
		return ErrKeyAlreadyExists
	}
	return s.repo.CreateString(key, value, ttl)
}

func (s *RedisStringService) GetString(key string) (string, error) {
	if err := s.common.ensureKeyExists(key); err != nil {
		return "", err
	}
	return s.repo.GetString(key)
}

func (s *RedisStringService) UpdateString(key string, value string, ttl time.Duration) error {
	if err := s.common.ensureKeyExists(key); err != nil {
		return err
	}
	return s.repo.CreateString(key, value, ttl)
}

func (s *RedisStringService) AppendString(key string, value string) (int64, error) {
	if err := s.common.ensureKeyExists(key); err != nil {
		return 0, err
	}
	return s.repo.AppendString(key, value)
}

func (s *RedisStringService) StringLength(key string) (int64, error) {
	if err := s.common.ensureKeyExists(key); err != nil {
		return 0, err
	}
	return s.repo.StringLength(key)
}
