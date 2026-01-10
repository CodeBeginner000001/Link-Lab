package handlers

import (
	"errors"
	"linklab-server/services"

	"github.com/gofiber/fiber/v2"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

func ValidationError(c *fiber.Ctx, field, message string) error {
	return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
		Error:   "validation_error",
		Message: message,
		Field:   field,
	})
}

func InvalidRequestBody(c *fiber.Ctx) error {
	return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
		Error:   "invalid_request_body",
		Message: "Request body must be valid JSON and match expected schema",
	})
}

func NotFound(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{
		Error:   "not_found",
		Message: message,
	})
}

func Conflict(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusConflict).JSON(ErrorResponse{
		Error:   "conflict",
		Message: message,
	})
}

func InternalError(c *fiber.Ctx, err error) error {
	return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
		Error:   "internal_error",
		Message: err.Error(),
	})
}

func HandleServiceError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, services.ErrKeyRequired):
		return ValidationError(c, "key", err.Error())

	case errors.Is(err, services.ErrFieldsEmpty):
		return ValidationError(c, "fields", err.Error())

	case errors.Is(err, services.ErrFieldRequired):
		return ValidationError(c, "field", err.Error())

	case errors.Is(err, services.ErrTTL):
		return ValidationError(c, "ttl", err.Error())

	case errors.Is(err, services.ErrInvalidInput):
		return ValidationError(c, "", err.Error())

	case errors.Is(err, services.ErrKeyNotFound):
		return NotFound(c, err.Error())

	case errors.Is(err, services.ErrFieldNotFound):
		return NotFound(c, err.Error())

	case errors.Is(err, services.ErrKeyAlreadyExists):
		return Conflict(c, err.Error())

	default:
		return InternalError(c, err)
	}
}
