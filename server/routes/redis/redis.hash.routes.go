package redis

import (
	redisHandlers "linklab-server/modules/redis/handlers"

	"github.com/gofiber/fiber/v2"
)

func RegisterRedisHashRoutes(router fiber.Router) {
	hash := router.Group("/hash")

	hash.Get("/test", redisHandlers.RedisHashTest)
	hash.Post("/", redisHandlers.CreateHashKey)
	
	hash.Get("/:key", redisHandlers.GetHash)
	hash.Put("/:key", redisHandlers.UpdateHash)
	
	hash.Get("/exists/:key/field/:field", redisHandlers.HashFieldExists)
	hash.Delete("/:key/field/:field", redisHandlers.DeleteHashField) 
	hash.Put("/field/:key", redisHandlers.CreateORUpdateHashField)
	hash.Get("/meta/:key", redisHandlers.GetHashMeta)
}
