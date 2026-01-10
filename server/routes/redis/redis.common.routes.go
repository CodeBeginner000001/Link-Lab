package redis

import (
	redisHandlers "linklab-server/handlers/redis"

	"github.com/gofiber/fiber/v2"
)

func RegisterRedisCommonRoutes(router fiber.Router) {
	hash := router.Group("/common")

	hash.Get("/test", redisHandlers.RedisCommonTest)
	hash.Get("/exists/:key", redisHandlers.Exists)
	hash.Get("/count", redisHandlers.CountKeys)
	hash.Delete("/:key", redisHandlers.Delete)
	hash.Get("/ttl/:key", redisHandlers.GetTTL)
	hash.Post("/ttl/:key", redisHandlers.SetTTL)
}
