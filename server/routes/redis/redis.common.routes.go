package redis

import (
	middlewares "linklab-server/middleware"
	redisHandlers "linklab-server/modules/redis/common"

	"github.com/gofiber/fiber/v2"
)

func RegisterRedisCommonRoutes(router fiber.Router) {
	hash := router.Group("/common")

	hash.Get("/test", redisHandlers.RedisCommonTest)
	hash.Get("/exists/:key", redisHandlers.Exists)
	hash.Get("/count", middlewares.ValidateBody[redisHandlers.CountKeysRequest]() ,redisHandlers.CountKeys)
	hash.Delete("/:key", redisHandlers.Delete)
	hash.Get("/ttl/:key", redisHandlers.GetTTL)
	hash.Post("/ttl/:key",middlewares.ValidateBody[redisHandlers.SetTTLRequest](), redisHandlers.SetTTL)
}
