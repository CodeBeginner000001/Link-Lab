package auth

import "errors"

var (
	ErrEmailRequired           = errors.New("email is required")
	ErrPasswordRequired        = errors.New("password is required")
	ErrUserAlreadyExists       = errors.New("an account with this email already exists")
	ErrSignupAlreadyInProgress = errors.New("signup already in progress for this email")
	ErrSessionExpired          = errors.New("your signup session has expired, please start again")
	ErrSessionCorrupted        = errors.New("your signup session is no longer valid")
	ErrOTPExpired              = errors.New("the OTP has expired, please request a new one")
	ErrInvalidOTP              = errors.New("the OTP you entered is incorrect")
	ErrTooManyAttempts         = errors.New("too many attempts, please try again later")
	ErrResendCoolDownTime      = errors.New("please wait before requesting another OTP")
)
