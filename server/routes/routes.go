package routes

import (
	authHandlers "linklab-server/modules/auth"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(
	app *fiber.App,
	authHandler *authHandlers.AuthHandler,
) {
	v1 := app.Group("/v1")

	app.Get("/health", HealthCard)

	RegisterAuthRoutes(v1, authHandler)
}
