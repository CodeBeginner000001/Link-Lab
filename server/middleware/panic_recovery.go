package middlewares

import (
	"linklab-server/logger"

	"github.com/gofiber/fiber/v2"
)

func PanicRecovery() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("Server is in panic mode", nil)
				_ = c.Next()
			}
		}()
		return c.Next()
	}
}
