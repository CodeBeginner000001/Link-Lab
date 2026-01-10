package redis

import (
	httpError "linklab-server/handlers"
	"linklab-server/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

func RedisStringTest(c *fiber.Ctx) error {
	return c.SendString("Redis String Data Structure is working! 🔐")
}

func CreateStringKey(c *fiber.Ctx) error {
	var body CreateStringRequest                // create an empty struct to hold a request
	if err := c.BodyParser(&body); err != nil { // store the request body empty struct
		return httpError.InvalidRequestBody(c)
	}
	if body.Key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}

	if body.Value == "" {
		return httpError.ValidationError(c, "value", "value is required")
	}

	if body.TTL < 0 {
		return httpError.ValidationError(c, "ttl", "ttl must be >= 0 (seconds)")
	}
	err := services.NewRedisStringService().CreateString(
		body.Key,
		body.Value,
		time.Duration(body.TTL)*time.Second,
	)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"status": "created",
		"key":    body.Key,
	})
}

func GetString(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}

	data, err := services.NewRedisStringService().GetString(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}

	return c.JSON(fiber.Map{
		"key":  key,
		"data": data,
	})
}

func UpdateStringKey(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	var body UpdateStringRequest                // create an empty struct to hold a request
	if err := c.BodyParser(&body); err != nil { // store the request body empty struct
		return httpError.InvalidRequestBody(c)
	}
	if body.Value == "" {
		return httpError.ValidationError(c, "value", "value is required")
	}

	if body.TTL < 0 {
		return httpError.ValidationError(c, "ttl", "ttl must be >= 0 (seconds)")
	}
	err := services.NewRedisStringService().UpdateString(
		key,
		body.Value,
		time.Duration(body.TTL)*time.Second, // converts seconds to time duration
	)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"status": "updated",
		"key":    key,
	})
}

func AppendString(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	var body AppendStringRequest                // create an empty struct to hold a request
	if err := c.BodyParser(&body); err != nil { // store the request body empty struct
		return httpError.InvalidRequestBody(c)
	}
	if body.Value == "" {
		return httpError.ValidationError(c, "value", "value is required")
	}
	length, err := services.NewRedisStringService().AppendString(key, body.Value)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"message": "value appended successfully",
		"key": key,
		"length": length,
	})
}

func StringLength(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	length, err := services.NewRedisStringService().StringLength(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"message": "value appended successfully",
		"key": key,
		"length": length,
	})
}