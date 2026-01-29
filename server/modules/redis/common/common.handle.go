package common

import (
	apperrors "linklab-server/errors"
	"linklab-server/http"
	"linklab-server/logger"
	"time"

	"github.com/gofiber/fiber/v2"
)

var redisCommonService = NewRedisCommonService()

func RedisCommonTest(c *fiber.Ctx) error {
	return http.Success(
		c,
		"Redis common service is working",
		nil,
	)
}

func Exists(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return http.ValidationError("key", "key is required")
	}
	exists, err := redisCommonService.Exists(c.Context(), key)
	if err != nil {
		logger.Error("redisExists: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	return http.Success(c, "OK", fiber.Map{
		"key":    key,
		"exists": exists,
	})
}

func CountKeys(c *fiber.Ctx) error {
	body, ok := c.Locals("body").(*CountKeysRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	count, err := redisCommonService.CountKeys(c.Context(), body.DataStructureType)
	if err != nil {
		logger.Error("redisCountKeys: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	return http.Success(c, "OK", fiber.Map{
		"data_structure_type": body.DataStructureType,
		"count":               count,
	})
}

func Delete(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return http.ValidationError("key", "key is required")
	}

	err := redisCommonService.DeleteStrict(c.Context(), key)
	if err != nil {
		logger.Error("redisDeleteKeys: api failed due to: ", err)
		return apperrors.HandleError(err)
	}

	return http.Success(c, "Key deleted", fiber.Map{
		"key": key,
	})
}

func GetTTL(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return http.ValidationError("key", "key is required")
	}
	ttl, err := redisCommonService.GetTTL(c.Context(), key)
	if err != nil {
		logger.Error("redisGetTTL: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	return http.Success(c, "OK", fiber.Map{
		"key": key,
		"ttl": ttl,
	})
}

func SetTTL(c *fiber.Ctx) error {
	key := c.Params("key")
	if key == "" {
		return http.ValidationError("key", "key is required")
	}
	body, ok := c.Locals("body").(*SetTTLRequest)
	if !ok {
		return http.InvalidRequestBody()
	}
	err := redisCommonService.SetTTL(c.Context(), key, time.Duration(body.TTL)*time.Second)
	if err != nil {
		logger.Error("redisSetTTL: api failed due to: ", err)
		return apperrors.HandleError(err)
	}
	return http.Success(c, "TTL updated", fiber.Map{
		"key": key,
		"ttl": body.TTL,
	})
}
