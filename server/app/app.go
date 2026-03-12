package app

import (
	"context"
	"errors"
	"linklab-server/aws/sqs"
	"linklab-server/config"
	"linklab-server/db"
	apphttp "linklab-server/http"
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

// New builds and configures the Fiber app instance.
func New(ctx context.Context) *fiber.App {
	config.LoadEnv()

	logger.Init()

	db.ConnectMongo()
	go db.MonitorMongo()
	db.ConnectRedis()
	go db.MonitorRedis()

	userRepo := mongoModule.NewUserRepo(db.MongoDB)
	userService := mongoModule.NewUserService(userRepo)
	redisHashService := redisHashModule.NewRedisHashService()
	redisCommonService := redisCommonModule.NewRedisCommonService()
	authService := authModule.NewAuthService(userService, redisHashService, redisCommonService)
	authHandler := authModule.NewAuthHandler(authService)

	sqsClient := sqs.NewClient(ctx)
	sqs.SetClient(sqsClient)

	app := fiber.New(fiber.Config{
		AppName: "LinkLab Auth API",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			if appErr, ok := err.(*apphttp.AppError); ok {
				return c.Status(appErr.StatusCode).JSON(apphttp.APIResponse{
					Success: false,
					Message: appErr.Message,
					Errors:  appErr.Fields,
				})
			}

			var fiberErr *fiber.Error
			if errors.As(err, &fiberErr) {
				if fiberErr.Code >= fiber.StatusInternalServerError {
					logger.Error(
						"Fiber internal error",
						err,
						logger.F("path", c.Path()),
						logger.F("method", c.Method()),
					)
				}
				return c.Status(fiberErr.Code).JSON(apphttp.APIResponse{
					Success: false,
					Message: fiberErr.Message,
				})
			}

			logger.Error(
				"Unhandled app error",
				err,
				logger.F("path", c.Path()),
				logger.F("method", c.Method()),
			)

			return c.Status(fiber.StatusInternalServerError).JSON(apphttp.APIResponse{
				Success: false,
				Message: "Internal server error",
			})
		},
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     config.GetEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"),
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
	}))
	app.Use(middlewares.PanicRecovery())
	routes.RegisterRoutes(app, authHandler)

	return app
}
