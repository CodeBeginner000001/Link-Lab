package routes

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	RegisterSwaggerRoutes(app)
	v1 := app.Group("/v1")
	RegisterAuthRoutes(v1)
	RegisterRedisRoutes(v1)
}
