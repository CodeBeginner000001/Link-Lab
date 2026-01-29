package rediserror

import "errors"

var (
	ErrRedisUnavailable = errors.New("Redis service is unavailable")
	ErrKeyAlreadyExists = errors.New("Key already exists")
	ErrKeyNotFound      = errors.New("Key not found")
	ErrRedisTimeout     = errors.New("Redis operation timed out")
	ErrRedisCommand     = errors.New("Redis command execution failed")
	ErrKeyExpired       = errors.New("Redis key has expired")
	ErrKeyNoTTL         = errors.New("Redis key has no TTL set")

	ErrKeyRequired   = errors.New("Key is required")
	ErrValueRequired = errors.New("Value is required")
	ErrFieldRequired = errors.New("Field is required")
	ErrFieldsEmpty   = errors.New("Fields cannot be empty")

	ErrTTL           = errors.New("TTL must be greater than zero")
	ErrInvalidInput  = errors.New("Invalid Redis input")
	ErrBy            = errors.New("Increment value must be greater than zero")
	ErrFieldNotFound = errors.New("Field not found")

	ErrLockNotOwned    = errors.New("Redis lock is not owned by caller")
	ErrLockNotAcquired = errors.New("Failed to acquire Redis lock")
)
