package routes

import (
	middlewares "linklab-server/middleware"
	authHandlers "linklab-server/modules/auth"

	"github.com/gofiber/fiber/v2"
)

func RegisterAuthRoutes(router fiber.Router, authHandler *authHandlers.AuthHandler) {
	auth := router.Group("/auth")

	auth.Get("/health", authHandler.AuthHealth)

	auth.Post("/signup", middlewares.ValidateBody[authHandlers.RegisterRequest](), authHandler.RegisterUser)
	auth.Get("/otp/session", authHandler.GetSignupSession)
	auth.Post("/otp/verify", middlewares.ValidateBody[authHandlers.VerifyOTPRequest](), authHandler.VerifyOTP)
	auth.Post("/otp/resend", authHandler.ResendOTP)
	auth.Post("/login", middlewares.ValidateBody[authHandlers.LoginRequest](), authHandler.Login)
	auth.Get("/me", authHandler.Me)
	auth.Post("/logout", authHandler.Logout)
	auth.Post("/refresh", authHandler.RefreshToken)

	// auth.Post("/password/forget", middlewares.ValidateBody[authHandlers.ForgetPasswordRequest](), authHandlers.ForgetPassword)
	// auth.Post("/password/verify")
	// auth.Post("/password/reset")
}
