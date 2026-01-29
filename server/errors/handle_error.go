package apperrors

import (
	"errors"
	"linklab-server/http"
)

func HandleError(err error) *http.AppError {
	if err == nil {
		return nil
	}

	switch {
	case errors.Is(err, ErrAuth):
		if appErr := HandleAuthError(err); appErr != nil {
			return appErr
		}
		return http.UnAuthorized("Authentication failed")

	case errors.Is(err, ErrMongo):
		return http.ServiceUnavailable("Database temporarily unavailable")

	case errors.Is(err, ErrRedis):
		return http.ServiceUnavailable("Cache service unavailable")

	case errors.Is(err, ErrSQS), errors.Is(err, ErrAWS):
		return http.ServiceUnavailable("Notification service unavailable")

	case errors.Is(err, ErrUtils):
		return http.InternalServerError("Internal server error")

	default:
		return http.InternalServerError("Internal server error")
	}
}
