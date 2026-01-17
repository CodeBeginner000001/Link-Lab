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
	auth.Post("/otp/verify",middlewares.ValidateBody[authHandlers.VerifyOTPRequest](), authHandlers.VerifyOTP)
	auth.Post("/otp/resend", authHandlers.ResendOTP)

	// auth.Post("/login")
	// auth.Post("/logout")

	// auth.Post("/refresh")
	
	// auth.Post("/password/forget")
	// auth.Post("/password/reset")
}
