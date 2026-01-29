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

	ErrSignupAlreadyInProgress         = errors.New("Signup already in progress")
	ErrForgetPasswordAlreadyInProgress = errors.New("Password reset already in progress")
	ErrSessionExpired                  = errors.New("Session expired, please start again")
	ErrSessionCorrupted                = errors.New("Invalid session state")

	ErrOTPExpired      = errors.New("Otp expired")
	ErrInvalidOTP      = errors.New("Invalid otp")
	ErrTooManyAttempts = errors.New("Too many attempts, try again later")
	ErrResendCooldown  = errors.New("Please wait before requesting another OTP")
)
