package auth

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type RegisterResponse struct {
	Email  string `json:"email"`
	SessionId string `json:"sessionId"`
	Message string `json:"message"`
}

type VerifyOTPRequest struct {
	OTP string `json:"otp"`
}

type LoginDTO struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
