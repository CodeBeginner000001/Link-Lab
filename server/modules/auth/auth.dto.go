package auth

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,password"`
}

type RegisterServiceResponse struct {
	SessionId string `json:"sessionId"`
	Email string `json:"email"`
	Message   string `json:"message"`
}

type SignupSessionInfoResponse struct {
	Email          string `json:"email"`
	OTPResendAfter string `json:"otp_resend_after"`
}

type ResendOTPResponse struct {
	OTPResendAfter string `json:"otp_resend_after"`
}

type VerifyOTPRequest struct {
	OTP string `json:"otp" validate:"required,len=6"`
}

type MeResponse struct {
	Id string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Avatar string `json:"avatar"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,password"`
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

type ForgetPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}
