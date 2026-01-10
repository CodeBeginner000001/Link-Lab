package routes

import (
	"github.com/gofiber/fiber/v2"
	redisRoutes "linklab-server/routes/redis"
)

func RegisterRedisRoutes(router fiber.Router) {
	redis:= router.Group("/redis")
	redisRoutes.RegisterRedisHashRoutes(redis)
	redisRoutes.RegisterRedisCommonRoutes(redis)
	redisRoutes.RegisterRedisStringRoutes(redis)
}
