package apperrors

import (
	"errors"
	"fmt"
)

var (
	ErrAuth  = errors.New("Auth error")
	ErrRedis = errors.New("Redis error")
	ErrMongo = errors.New("MongoDB error")
	ErrSQS   = errors.New("SQS error")
	ErrAWS   = errors.New("AWS errror")
	ErrUtils = errors.New("Utils errror")
)

func WrapAuth(err error) error {
	if err == nil {
		return ErrAuth
	}
	return fmt.Errorf("%w: %w", ErrAuth, err)
}

func WrapRedis(err error) error {
	if err == nil {
		return ErrRedis
	}
	return fmt.Errorf("%w: %w", ErrRedis, err)
}
