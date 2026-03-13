package app

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"linklab-server/aws/sqs"
	"linklab-server/config"
	"linklab-server/db"
	"linklab-server/http"
	"linklab-server/logger"
	middlewares "linklab-server/middleware"
	authModule "linklab-server/modules/auth"
	mongoModule "linklab-server/modules/mongo"
	redisCommonModule "linklab-server/modules/redis/common"
	redisHashModule "linklab-server/modules/redis/hash"
	"linklab-server/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

var (
	once      sync.Once
	fiberApp  *fiber.App
	fiberInit error
)

func Build() (*fiber.App, error) {
	once.Do(func() {
		config.LoadEnv()
		config.InitAppConfig()

		logger.Init()

		if err := db.ConnectMongo(); err != nil {
			fiberInit = fmt.Errorf("connect mongo: %w", err)
			return
		}

		if err := db.ConnectRedis(); err != nil {
			fiberInit = fmt.Errorf("connect redis: %w", err)
			return
		}

		userRepo := mongoModule.NewUserRepo(db.MongoDB)
		userService := mongoModule.NewUserService(userRepo)
		redisHashService := redisHashModule.NewRedisHashService()
		redisCommonService := redisCommonModule.NewRedisCommonService()
		authService := authModule.NewAuthService(userService, redisHashService, redisCommonService)
		authHandler := authModule.NewAuthHandler(authService)

		sqsClient := sqs.NewClient(context.Background())
		sqs.SetClient(sqsClient)

		fiberApp = fiber.New(fiber.Config{
			AppName: "LinkLab Auth API",
			ErrorHandler: func(c *fiber.Ctx, err error) error {
				if appErr, ok := err.(*http.AppError); ok {
					return c.Status(appErr.StatusCode).JSON(http.APIResponse{
						Success: false,
						Message: appErr.Message,
						Errors:  appErr.Fields,
					})
				}

				if errors.Is(err, fiber.ErrNotFound) {
					return c.Status(fiber.StatusNotFound).JSON(http.APIResponse{
						Success: false,
						Message: "Not found",
					})
				}

				logger.Error("Unhandled server error", err)

				return c.Status(fiber.StatusInternalServerError).JSON(http.APIResponse{
					Success: false,
					Message: "Internal server error",
				})
			},
		})

		fiberApp.Use(cors.New(cors.Config{
			AllowOrigins:     config.GetEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"),
			AllowCredentials: true,
			AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
			AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		}))
		fiberApp.Use(middlewares.PanicRecovery())
		routes.RegisterRoutes(fiberApp, authHandler)
	})

	return fiberApp, fiberInit
}
