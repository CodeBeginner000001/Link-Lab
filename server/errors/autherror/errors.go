package autherror

import (
	"errors"
)

var (
	ErrEmailRequired    = errors.New("Email is required")
	ErrPasswordRequired = errors.New("Password is required")

	ErrUserAlreadyExists  = errors.New("User already exists")
	ErrInvalidCredentials = errors.New("Invalid credentials")
	ErrInvalidToken       = errors.New("Invalid token")
	ErrUnauthorized   = errors.New("unauthorized")
	
	ErrSignupAlreadyInProgress         = errors.New("Signup already in progress")
	ErrForgetPasswordAlreadyInProgress = errors.New("Password reset already in progress")
	ErrSessionExpired                  = errors.New("Session expired, Please start again")
	ErrSessionCorrupted                = errors.New("Session expired, Please start again")

	ErrOTPExpired      = errors.New("OTP expired")
	ErrInvalidOTP      = errors.New("Invalid OTP")
	ErrTooManyAttempts = errors.New("Too many attempts, try again later")
	ErrResendCooldown  = errors.New("Please wait before requesting another OTP")
)
