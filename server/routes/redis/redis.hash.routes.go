package redis

import (
	redisHandlers "linklab-server/handlers/redis"

	"github.com/gofiber/fiber/v2"
)

func RegisterRedisHashRoutes(router fiber.Router) {
	hash := router.Group("/hash")

	hash.Get("/test", redisHandlers.RedisHashTest)  // used to test if hash route is running
	hash.Post("/", redisHandlers.CreateHashKey) // Create a hash key 
	
	hash.Get("/:key", redisHandlers.GetHash)  // Get a specific key
	hash.Put("/:key", redisHandlers.UpdateHash)  // Update a specific key
	
	hash.Get("/exists/:key/field/:field", redisHandlers.HashFieldExists) // Check if field exists in a key
	hash.Delete("/:key/field/:field", redisHandlers.DeleteHashField)  // Delete a field in a key 
	hash.Put("/field/:key", redisHandlers.CreateORUpdateHashField) // set field for a specific key
	hash.Get("/meta/:key", redisHandlers.GetHashMeta)   // Get the meta data of a key
}
