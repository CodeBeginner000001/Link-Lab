package auth

import "errors"

var (
	ErrEmailRequired = errors.New("email is required")
	ErrPasswordRequired = errors.New("password is required")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrSignupAlreadyInProgress = errors.New("signup already in progress")
	ErrSessionExpired = errors.New("redis session expired")
	ErrOTPExpired = errors.New("otp expired")
	ErrTooManyAttempts = errors.New("too many attempts. try again")
	ErrInvalidOTP = errors.New("invalid otp")
)
