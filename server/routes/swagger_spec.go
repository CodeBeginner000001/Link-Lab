package routes

import (
	"os"

	"github.com/gofiber/fiber/v2"
)

func serveOpenAPISpec(c *fiber.Ctx) error {

	// Example: simple protection
	if c.Get("X-Docs-Key") != "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}

	data, err := os.ReadFile("./api/openapi.yaml")
	if err != nil {
		return c.Status(500).SendString("Failed to load spec")
	}

	return c.Type("yaml").Send(data)
}
