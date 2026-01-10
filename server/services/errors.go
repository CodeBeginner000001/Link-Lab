package services

import "errors"

var (
	ErrKeyNotFound      = errors.New("key not found")
	ErrFieldNotFound    = errors.New("field not found")
	ErrKeyAlreadyExists = errors.New("key already exists")
	ErrInvalidInput     = errors.New("invalid input")
	ErrKeyRequired      = errors.New("key is required")
	ErrFieldRequired    = errors.New("fields is required")
	ErrValueRequired    = errors.New("Value is required")
	ErrFieldsEmpty      = errors.New("fields cannot be empty")
	ErrTTL              = errors.New("ttl must be greater than 0")
)
