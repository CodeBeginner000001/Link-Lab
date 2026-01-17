package handlers

import (
	httpError "linklab-server/http"
	"linklab-server/modules/redis"
	redisServices "linklab-server/modules/redis/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

func RedisStringTest(c *fiber.Ctx) error {
	return c.SendString("Redis String Data Structure is working! 🔐")
}

func CreateStringKey(c *fiber.Ctx) error {
	var body CreateStringRequest                // create an empty struct to hold a request
	if err := c.BodyParser(&body); err != nil { // store the request body empty struct
		return httpError.InvalidRequestBody()
	}
	if body.Key == "" {
		return httpError.ValidationError("key", "key is required")
	}

	if body.Value == "" {
		return httpError.ValidationError("value", "value is required")
	}

	if body.TTL < 0 {
		return httpError.ValidationError("ttl", "ttl must be >= 0 (seconds)")
	}
	err := redisServices.NewRedisStringService().CreateString(c.Context(),
		body.Key,
		body.Value,
		time.Duration(body.TTL)*time.Second,
	)
	if err != nil {
		return redis.HandleRedisServiceError(err)
	}
	return c.JSON(fiber.Map{
		"status": "created",
		"key":    body.Key,
	})
}

func GetString(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}

	data, err := redisServices.NewRedisStringService().GetString(c.Context(), key)
	if err != nil {
		return redis.HandleRedisServiceError(err)
	}

	return c.JSON(fiber.Map{
		"key":  key,
		"data": data,
	})
}

func UpdateStringKey(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}
	var body UpdateStringRequest                // create an empty struct to hold a request
	if err := c.BodyParser(&body); err != nil { // store the request body empty struct
		return httpError.InvalidRequestBody()
	}
	if body.Value == "" {
		return httpError.ValidationError("value", "value is required")
	}

	if body.TTL < 0 {
		return httpError.ValidationError("ttl", "ttl must be >= 0 (seconds)")
	}
	err := redisServices.NewRedisStringService().UpdateString(c.Context(),
		key,
		body.Value,
		time.Duration(body.TTL)*time.Second,
	)
	if err != nil {
		return redis.HandleRedisServiceError(err)
	}
	return c.JSON(fiber.Map{
		"status": "updated",
		"key":    key,
	})
}

func AppendString(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}
	var body AppendStringRequest
	if err := c.BodyParser(&body); err != nil {
		return httpError.InvalidRequestBody()
	}
	if body.Value == "" {
		return httpError.ValidationError("value", "value is required")
	}
	length, err := redisServices.NewRedisStringService().AppendString(c.Context(), key, body.Value)
	if err != nil {
		return redis.HandleRedisServiceError(err)
	}
	return c.JSON(fiber.Map{
		"message": "value appended successfully",
		"key":     key,
		"length":  length,
	})
}

func StringLength(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}
	length, err := redisServices.NewRedisStringService().StringLength(c.Context(), key)
	if err != nil {
		return redis.HandleRedisServiceError(err)
	}
	return c.JSON(fiber.Map{
		"message": "value appended successfully",
		"key":     key,
		"length":  length,
	})
}
