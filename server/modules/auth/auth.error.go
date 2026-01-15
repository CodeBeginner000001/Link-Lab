package auth

import (
	"errors"
	"linklab-server/http"
)

func HandleAuthServiceError(err error) *http.AppError {
	switch {
	case errors.Is(err, ErrEmailRequired):
		return http.ValidationError("email", err.Error())

	case errors.Is(err, ErrPasswordRequired):
		return http.ValidationError("password", err.Error())

	case errors.Is(err, ErrUserAlreadyExists):
		return http.Conflict(err.Error())

	case errors.Is(err, ErrSignupAlreadyInProgress):
		return http.Conflict(err.Error())

	default:
		return http.Internal(err)
	}
}
