package middlewares

import "github.com/gofiber/fiber/v2"

func PanicRecovery() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				c.Status(500).JSON(fiber.Map{
					"success": false,
					"message": "Internal server error",
				})
			}
		}()
		return c.Next()
	}
}
