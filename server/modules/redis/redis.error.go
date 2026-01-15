package redis

import (
	"errors"
	"linklab-server/modules/redis/services"
	"linklab-server/http"
)
func HandleRedisServiceError(err error) *http.AppError {
	switch {
	case errors.Is(err, services.ErrKeyRequired):
		return http.ValidationError("key", err.Error())

	case errors.Is(err, services.ErrValueRequired):
		return http.ValidationError("value", err.Error())

	case errors.Is(err, services.ErrFieldRequired):
		return http.ValidationError("field", err.Error())

	case errors.Is(err, services.ErrFieldsEmpty):
		return http.ValidationError("fields", err.Error())

	case errors.Is(err, services.ErrTTL):
		return http.ValidationError("ttl", err.Error())

	case errors.Is(err, services.ErrInvalidInput):
		return http.ValidationError("", err.Error())

	case errors.Is(err, services.ErrKeyNotFound):
		return http.NotFound(err.Error())

	case errors.Is(err, services.ErrFieldNotFound):
		return http.NotFound(err.Error())

	case errors.Is(err, services.ErrKeyAlreadyExists):
		return http.Conflict(err.Error())

	default:
		return http.Internal(err)
	}
}