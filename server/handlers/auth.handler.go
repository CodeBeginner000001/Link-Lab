package handlers

import "github.com/gofiber/fiber/v2"

func AuthTest(c *fiber.Ctx) error {
	return c.SendString("Auth route is working! 🔐")
}
