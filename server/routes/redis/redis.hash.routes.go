package redis

import (
	middlewares "linklab-server/middleware"
	redisHandlers "linklab-server/modules/redis/hash"

	"github.com/gofiber/fiber/v2"
)

func RegisterRedisHashRoutes(router fiber.Router) {
	hash := router.Group("/hash")

	hash.Get("/test", redisHandlers.RedisHashTest)
	hash.Post("/", middlewares.ValidateBody[redisHandlers.CreateHashRequest](), redisHandlers.CreateHashKey)
	hash.Get("/:key", redisHandlers.GetHash)
	hash.Delete("/:key/field/:field", redisHandlers.DeleteHashField)
	hash.Put("/field/:key", middlewares.ValidateBody[redisHandlers.SetORUpdateFieldRequest](), redisHandlers.CreateORUpdateHashField)
	hash.Get("/meta/:key", redisHandlers.GetHashMeta)
}
