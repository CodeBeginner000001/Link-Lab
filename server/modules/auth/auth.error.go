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

	case errors.Is(err, ErrSessionExpired):
		return http.Gone(err.Error())

	case errors.Is(err, ErrSessionCorrupted):
		return http.UnAuthorized(err.Error())

	case errors.Is(err, ErrInvalidOTP):
		return http.NewBadRequest(err.Error())

	case errors.Is(err, ErrOTPExpired):
		return http.Gone(err.Error())

	case errors.Is(err, ErrTooManyAttempts):
		return http.TooManyRequests(err.Error())

	case errors.Is(err, ErrResendCoolDownTime):
		return http.TooManyRequests(err.Error())

	default:
		return http.Internal(err)
	}
}
