package services

import "errors"

var (
	ErrKeyRequired      = errors.New("key is required")
	ErrValueRequired    = errors.New("Value is required")
	ErrFieldRequired    = errors.New("fields is required")
	ErrFieldsEmpty      = errors.New("fields cannot be empty")
	ErrTTL              = errors.New("ttl must be greater than 0")
	ErrInvalidInput     = errors.New("invalid input")
	ErrKeyNotFound      = errors.New("key not found")
	ErrFieldNotFound    = errors.New("field not found")
	ErrKeyAlreadyExists = errors.New("key already exists")
)
