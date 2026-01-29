package auth

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,password"`
}

type RegisterServiceResponse struct {
	Email     string `json:"email"`
	SessionId string `json:"sessionId"`
	Message   string `json:"message"`
}

type VerifyOTPRequest struct {
	OTP string `json:"otp" validate:"required,len=6"`
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
