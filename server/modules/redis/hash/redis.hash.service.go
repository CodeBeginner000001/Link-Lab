package hash

import (
	"context"
	apperrors "linklab-server/errors"
	"linklab-server/errors/rediserror"
	"linklab-server/logger"
	redisCommonService "linklab-server/modules/redis/common"
	"time"
)

type RedisHashService struct {
	repo   *RedisHashRepository
	common *redisCommonService.RedisCommonService
}

func NewRedisHashService() *RedisHashService {
	return &RedisHashService{
		repo:   &RedisHashRepository{},
		common: redisCommonService.NewRedisCommonService(),
	}
}

func (s *RedisHashService) CreateHash(
	ctx context.Context,
	key string,
	fields map[string]string,
	ttl time.Duration,
) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if len(fields) == 0 {
		return apperrors.WrapRedis(rediserror.ErrFieldsEmpty)
	}
	if ttl <= 0 {
		return apperrors.WrapRedis(rediserror.ErrTTL)
	}

	created, err := s.repo.CreateHashIfNotExists(ctx, key, fields, ttl)
	if err != nil {
		logger.Error("createHash: CreateHashIfNotExists repo failed: ", err)
		return apperrors.WrapRedis(err)
	}
	if !created {
		return apperrors.WrapRedis(rediserror.ErrKeyAlreadyExists)
	}

	return nil
}

func (s *RedisHashService) GetHash(ctx context.Context, key string) (map[string]string, error) {
	if key == "" {
		return nil, apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}

	data, err := s.repo.GetHash(ctx, key)
	if err != nil {
		logger.Error("getHash: GetHash repo failed: ", err)
		return nil, apperrors.WrapRedis(err)
	}

	if len(data) == 0 {
		return nil, apperrors.WrapRedis(rediserror.ErrKeyNotFound)
	}

	return data, nil
}

func (s *RedisHashService) IncrementField(
	ctx context.Context,
	key string,
	field string,
	by int64,
) (int64, error) {
	if key == "" {
		return 0, apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if field == "" {
		return 0, apperrors.WrapRedis(rediserror.ErrFieldRequired)
	}
	if by < 1 {
		return 0, apperrors.WrapRedis(rediserror.ErrBy)
	}

	val, err := s.repo.IncrementHashField(ctx, key, field, by)
	if err != nil {
		logger.Error("IncrementField: IncrementHashField repo failed: ", err)
		return 0, apperrors.WrapRedis(err)
	}

	return val, nil
}

func (s *RedisHashService) CreateORUpdateHashFieldStrict(ctx context.Context, key, field, value string) error {

	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if field == "" {
		return apperrors.WrapRedis(rediserror.ErrFieldRequired)
	}
	if value == "" {
		return apperrors.WrapRedis(rediserror.ErrValueRequired)
	}

	if err := s.repo.CreateORUpdateHashField(ctx, key, field, value); err != nil {
		logger.Error("createORUpdateHashFieldStrict: CreateORUpdateHashField repo failed: ", err)
		return apperrors.WrapRedis(err)
	}

	return nil
}

func (s *RedisHashService) CreateORUpdateHashField(ctx context.Context, key, field, value string) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if field == "" {
		return apperrors.WrapRedis(rediserror.ErrFieldRequired)
	}

	if err := s.repo.CreateORUpdateHashField(ctx, key, field, value); err != nil {
		logger.Error("createORUpdateHashField: CreateORUpdateHashField repo failed:", err)
		return apperrors.WrapRedis(err)
	}

	return nil
}

func (s *RedisHashService) DeleteHashField(ctx context.Context, key, field string) error {
	if key == "" {
		return apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}
	if field == "" {
		return apperrors.WrapRedis(rediserror.ErrFieldRequired)
	}

	if err := s.common.EnsureKeyExists(ctx, key); err != nil {
		return err
	}

	if err := s.repo.DeleteHashField(ctx, key, field); err != nil {
		logger.Error("deleteHashField: DeleteHashField repo failed: ", err)
		return apperrors.WrapRedis(err)
	}
	return nil
}

func (s *RedisHashService) GetHashMeta(ctx context.Context, key string) (map[string]interface{}, error) {
	if key == "" {
		return nil, apperrors.WrapRedis(rediserror.ErrKeyRequired)
	}

	if err := s.common.EnsureKeyExists(ctx, key); err != nil {
		return nil, err
	}

	meta, err := s.repo.GetHashMeta(ctx, key)
	if err != nil {
		logger.Error("getHashMeta: GetHashMeta repo failed: ", err)
		return nil, apperrors.WrapRedis(err)
	}

	return meta, nil
}
