package middlewares

import (
	"bytes"
	"encoding/json"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"linklab-server/http"
)

func ValidateBody[T any]() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body T

		decoder := json.NewDecoder(bytes.NewReader(c.Body()))
		decoder.DisallowUnknownFields()

		if err := decoder.Decode(&body); err != nil {
			return http.BadRequest("Invalid request body")
		}

		if err := v.Struct(body); err != nil {
			if ve, ok := err.(validator.ValidationErrors); ok {
				fields := make([]http.FieldError, 0, len(ve))

				for _, e := range ve {
					fields = append(fields, http.FieldError{
						Field: e.Field(),
						Error: getValidationMessage(e),
					})
				}

				return &http.AppError{
					StatusCode: 422,
					Message:    "Validation failed",
					Fields:     fields,
				}
			}
		}

		c.Locals("body", &body)
		return c.Next()
	}
}
