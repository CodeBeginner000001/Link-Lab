package redis

import (
	"github.com/gofiber/fiber/v2"
	redisHandlers "linklab-server/modules/redis/handlers"
)

func RegisterRedisStringRoutes(router fiber.Router) {
	string:= router.Group("/string")

	string.Get("/test", redisHandlers.RedisStringTest)
	string.Post("/", redisHandlers.CreateStringKey)
	string.Get("/:key", redisHandlers.GetString)
	string.Put("/:key", redisHandlers.UpdateStringKey)
	string.Post("/append/:key", redisHandlers.AppendString)
	string.Get("/len/:key", redisHandlers.StringLength)
}
