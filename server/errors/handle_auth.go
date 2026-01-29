package apperrors

import (
	"errors"
	"linklab-server/errors/autherror"
	"linklab-server/http"
)

func HandleAuthError(err error) *http.AppError {
	if err == nil {
		return nil
	}

	switch {
	case errors.Is(err, autherror.ErrEmailRequired),
		errors.Is(err, autherror.ErrPasswordRequired):
		return http.BadRequest(err.Error())

	case errors.Is(err, autherror.ErrInvalidToken):
		return http.UnAuthorized(err.Error())

	case errors.Is(err, autherror.ErrUserAlreadyExists):
		return http.Conflict(err.Error())

	case errors.Is(err, autherror.ErrInvalidCredentials):
		return http.UnAuthorized(err.Error())

	case errors.Is(err, autherror.ErrSignupAlreadyInProgress):
		return http.Conflict(err.Error())

	case errors.Is(err, autherror.ErrForgetPasswordAlreadyInProgress):
		return http.Conflict(err.Error())

	case errors.Is(err, autherror.ErrSessionExpired):
		return http.Gone(err.Error())

	case errors.Is(err, autherror.ErrSessionCorrupted):
		return http.BadRequest(err.Error())

	case errors.Is(err, autherror.ErrInvalidOTP):
		return http.BadRequest(err.Error())

	case errors.Is(err, autherror.ErrOTPExpired):
		return http.Gone(err.Error())

	case errors.Is(err, autherror.ErrTooManyAttempts),
		errors.Is(err, autherror.ErrResendCooldown):
		return http.TooManyRequests(err.Error())
	}

	return http.ServiceUnavailable("Authentication service unavailable")
}
