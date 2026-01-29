package apperrors

import (
	"errors"

	"linklab-server/errors/rediserror"
	"linklab-server/http"
)

func HandleRedisError(err error) *http.AppError {
	if err == nil {
		return nil
	}

	switch {
	case errors.Is(err, rediserror.ErrRedisUnavailable),
		errors.Is(err, rediserror.ErrRedisTimeout):
		return http.ServiceUnavailable(err.Error())

	case errors.Is(err, rediserror.ErrLockNotAcquired):
		return http.Conflict(err.Error())

	case errors.Is(err, rediserror.ErrLockNotOwned):
		return http.Forbidden(err.Error())

	case errors.Is(err, rediserror.ErrKeyAlreadyExists):
		return http.Conflict(err.Error())

	case errors.Is(err, rediserror.ErrKeyNotFound),
		errors.Is(err, rediserror.ErrFieldNotFound):
		return http.NotFound(err.Error())

	case errors.Is(err, rediserror.ErrKeyExpired):
		return http.Gone(err.Error())

	case errors.Is(err, rediserror.ErrKeyNoTTL):
		return http.BadRequest(err.Error())

	case errors.Is(err, rediserror.ErrKeyRequired),
		errors.Is(err, rediserror.ErrValueRequired),
		errors.Is(err, rediserror.ErrFieldRequired),
		errors.Is(err, rediserror.ErrFieldsEmpty),
		errors.Is(err, rediserror.ErrTTL),
		errors.Is(err, rediserror.ErrBy),
		errors.Is(err, rediserror.ErrInvalidInput):
		return http.BadRequest(err.Error())

	case errors.Is(err, rediserror.ErrRedisCommand):
		return http.InternalServerError(err.Error())
	}

	return http.InternalServerError("Unhandled Redis error")
}