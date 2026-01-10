package redis

import (
	httpError "linklab-server/handlers"
	"linklab-server/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

func RedisCommonTest(c *fiber.Ctx) error {
	return c.SendString("Redis Data Structure is working! 🔐")
}

func Exists(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	exists, err := services.NewRedisCommonService().Exists(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"Key":    key,
		"exists": exists,
	})
}

func CountKeys(c *fiber.Ctx) error {
	var body CountKeysRequest
	if err := c.BodyParser(&body); err != nil {
		return httpError.InvalidRequestBody(c)
	}
	if body.DataStructureType == "" {
		return httpError.ValidationError(c, "data_structure_type", "data_structure_type is required")
	}
	count, err := services.NewRedisCommonService().CountKeys(body.DataStructureType)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"count": count,
	})
}

func Delete(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}

	err := services.NewRedisCommonService().Delete(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}

	return c.JSON(fiber.Map{
		"status": "deleted",
		"key":    key,
	})
}

func GetTTL(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	ttl, err := services.NewRedisCommonService().GetTTL(key)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"key": key,
		"ttl": ttl,
	})
}

func SetTTL(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return httpError.ValidationError(c, "key", "key is required")
	}
	var body SetTTLRequest
	if err := c.BodyParser(&body); err != nil {
		return httpError.InvalidRequestBody(c)
	}
	err := services.NewRedisCommonService().SetTTL(key, time.Duration(body.TTL)*time.Second)
	if err != nil {
		return httpError.HandleServiceError(c, err)
	}
	return c.JSON(fiber.Map{
		"status": "ttl updated",
		"key":    key,
		"ttl":    body.TTL,
	})
}
