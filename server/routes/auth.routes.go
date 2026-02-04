package routes

import (
	authHandlers "linklab-server/modules/auth"
	middlewares "linklab-server/middleware"

	"github.com/gofiber/fiber/v2"
)

func RegisterAuthRoutes(router fiber.Router) {
	auth := router.Group("/auth")

	auth.Get("/health", authHandlers.AuthHealth)

	auth.Post("/signup", middlewares.ValidateBody[authHandlers.RegisterRequest](), authHandlers.RegisterUser)
	auth.Get("/otp/session",authHandlers.GetSignupSession)
	auth.Post("/otp/verify",middlewares.ValidateBody[authHandlers.VerifyOTPRequest](), authHandlers.VerifyOTP)
	auth.Post("/otp/resend", authHandlers.ResendOTP)
	auth.Post("/login", middlewares.ValidateBody[authHandlers.LoginRequest](),authHandlers.Login)
	auth.Get("/me", authHandlers.Me)
	auth.Post("/logout", authHandlers.Logout)
	auth.Post("/refresh",authHandlers.RefreshToken)
	
	// auth.Post("/password/forget", middlewares.ValidateBody[authHandlers.ForgetPasswordRequest](), authHandlers.ForgetPassword)
	// auth.Post("/password/verify")
	// auth.Post("/password/reset")
}
