package routes

import (
	"linklab-server/handlers"
	"github.com/gofiber/fiber/v2"
)

func RegisterAuthRoutes(router fiber.Router) {
	auth := router.Group("/auth")

	auth.Get("/test", handlers.AuthTest)
	// auth.Post("/signup")
	// auth.Post("/otp/verify")
	// auth.Post("/otp/resend")
	// auth.Post("/login")
	// auth.Post("/logout")
	// auth.Post("/refresh")
	// auth.Post("/password/forget")
	// auth.Post("/password/reset")
}
