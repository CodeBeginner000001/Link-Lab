package hash

import (
	apperrors "linklab-server/errors"
	"linklab-server/http"
	httpError "linklab-server/http"
	"linklab-server/logger"
	"time"

	"github.com/gofiber/fiber/v2"
)

var redisHashService = NewRedisHashService()

func RedisHashTest(c *fiber.Ctx) error {
	return c.SendString("Redis Hash Data Structure is working! 🔐")
}

func CreateHashKey(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*CreateHashRequest)
	if !ok {
		return http.InvalidRequestBody()
	}

	if err := redisHashService.CreateHash(
		c.Context(),
		body.Key,
		body.Fields,
		time.Duration(body.TTL)*time.Second,
	); err != nil {
		logger.Error("redisCreateHashKey: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "Hash created", fiber.Map{
		"key": body.Key,
	})
}

func GetHash(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}

	data, err := redisHashService.GetHash(c.Context(), key)
	if err != nil {
		logger.Error("redisGetHash: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "OK", fiber.Map{
		"key":  key,
		"data": data,
	})
}

func DeleteHashField(c *fiber.Ctx) error {
	key := c.Params("key")
	field := c.Params("field")

	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}
	if field == "" {
		return httpError.ValidationError("field", "field is required")
	}

	if err := redisHashService.DeleteHashField(
		c.Context(),
		key,
		field,
	); err != nil {
		logger.Error("redisDeleteHashField: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "Field deleted", fiber.Map{
		"key":   key,
		"field": field,
	})
}

func CreateORUpdateHashField(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}
	body, ok := c.Locals("body").(*SetORUpdateFieldRequest)
	if !ok {
		return http.InvalidRequestBody()
	}

	if err := redisHashService.CreateORUpdateHashField(
		c.Context(),
		key,
		body.Field,
		body.Value,
	); err != nil {
		logger.Error("redisCreateORUpdateHashField: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "Field updated", fiber.Map{
		"key":   key,
		"field": body.Field,
	})
}

func GetHashMeta(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError("key", "key is required")
	}

	meta, err := redisHashService.GetHashMeta(c.Context(), key)
	if err != nil {
		logger.Error("redisGetHashMeta: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(
		c,
		"Hash metadata fetched",
		fiber.Map{
			"key":  key,
			"meta": meta,
		},
	)
}
