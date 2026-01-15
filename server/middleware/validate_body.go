package middlewares

import (
	"linklab-server/http"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var v = validator.New()

func ValidateBody[T any]() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body T

		if err := c.BodyParser(&body); err != nil {
			return http.InvalidRequestBody()
		}

		if err := v.Struct(body); err != nil {
			validationErrors := err.(validator.ValidationErrors)

			ve := validationErrors[0]

			return http.ValidationError(
				ve.Field(),
				getValidationMessage(ve),
			)
		}

		c.Locals("body", &body)
		return c.Next()
	}
}
