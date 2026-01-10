package redis

import (
	redisHandlers "linklab-server/handlers/redis"

	"github.com/gofiber/fiber/v2"
)

func RegisterRedisCommonRoutes(router fiber.Router) {
	hash := router.Group("/common")

	hash.Get("/test", redisHandlers.RedisCommonTest)  // used to test if hash route is running
	hash.Get("/exists/:key", redisHandlers.Exists) // check if key exists
	hash.Get("/count", redisHandlers.CountKeys)  // Get total hash keys count
	hash.Delete("/:key", redisHandlers.Delete)  // Delete a specific key
	hash.Get("/ttl/:key", redisHandlers.GetTTL)    // check keys ttl
	hash.Post("/ttl/:key", redisHandlers.SetTTL)   // set keys ttl
}
