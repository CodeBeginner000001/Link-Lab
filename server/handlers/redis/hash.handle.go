package redis

import (
	httpError "linklab-server/handlers"
	"linklab-server/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

func RedisHashTest(c *fiber.Ctx) error {
	return c.SendString("Redis Hash Data Structure is working! 🔐")
}

func CreateHashKey(c *fiber.Ctx) error {
	var body CreateHashRequest                  // create an empty struct to hold a request
	if err := c.BodyParser(&body); err != nil { // store the request body empty struct
		return httpError.InvalidRequestBody(c)
	}
	if body.Key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}

	if len(body.Fields) == 0 {
		return httpError.ValidationError(c, "fields", "fields must be a non-empty object of strings")
	}

	if body.TTL < 0 {
		return httpError.ValidationError(c, "ttl", "ttl must be >= 0 (seconds)")
	}
	err := services.NewRedisHashService().CreateHash(
		body.Key,
		body.Fields,
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

func GetHash(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	data, err := services.NewRedisHashService().GetHash(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"key":  key,
		"data": data,
	})
}

func UpdateHash(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}

	var body UpdateHashRequest
	if err := c.BodyParser(&body); err != nil {
		return httpError.InvalidRequestBody(c)
	}

	if len(body.Fields) == 0 {
		return httpError.ValidationError(c, "fields", "fields must be a non-empty object of strings")
	}

	err := services.NewRedisHashService().UpdateHash(key, body.Fields)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}

	return c.JSON(fiber.Map{
		"status": "updated",
		"key":    key,
	})
}

func HashFieldExists(c *fiber.Ctx) error {
	key := c.Params("key")
	field := c.Params("field")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	if field == "" {
		return httpError.ValidationError(c, "field", "field is required")
	}
	exists, err := services.NewRedisHashService().HashFieldExists(key, field)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"key":    key,
		"field":  field,
		"exists": exists,
	})
}

func DeleteHashField(c *fiber.Ctx) error {
	key := c.Params("key")
	field := c.Params("field")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	if field == "" {
		return httpError.ValidationError(c, "field", "field is required")
	}
	err := services.NewRedisHashService().DeleteHashField(key, field)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"status": "field deleted",
		"key":    key,
		"field":  field,
	})
}

func CreateORUpdateHashField(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	var body SetORUpdateFieldRequest
	if err := c.BodyParser(&body); err != nil {
		return httpError.InvalidRequestBody(c)
	}
	if len(body.Field) == 0 {
		return httpError.ValidationError(c, "fields", "fields must be a non-empty object of strings")
	}
	if body.Value == "" {
		return httpError.ValidationError(c, "value", "value is required")
	}
	err := services.NewRedisHashService().CreateORUpdateHashField(key, body.Field, body.Value)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"status": "field set",
		"key":    key,
		"field":  body.Field,
	})
}

func GetHashMeta(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}

	meta, err := services.NewRedisHashService().GetHashMeta(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"key":  key,
		"meta": meta,
	})
}
