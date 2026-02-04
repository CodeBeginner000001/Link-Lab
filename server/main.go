package main

import (
	"context"
	"linklab-server/aws/sqs"
	"linklab-server/db"
	"linklab-server/http"
	"linklab-server/logger"
	middlewares "linklab-server/middleware"
	"linklab-server/routes"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	logger.Init()
	defer logger.Sync()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db.ConnectMongo()
	go db.MonitorMongo()
	db.ConnectRedis()
	go db.MonitorRedis()
	
	sqsClient := sqs.NewClient(ctx)
	sqs.SetClient(sqsClient)

	app := fiber.New(fiber.Config{
		AppName: "LinkLab Auth API",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			if appErr, ok := err.(*http.AppError); ok {
				return c.Status(appErr.StatusCode).JSON(http.APIResponse{
					Success: false,
					Message: appErr.Message,
					Errors:  appErr.Fields,
				})
			}

			logger.Error("Error from Main.go", err)

			return c.Status(500).JSON(http.APIResponse{
				Success: false,
				Message: "Internal server error",
			})
		},
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000",
		AllowCredentials: true,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))
	app.Use(middlewares.PanicRecovery())
	routes.RegisterRoutes(app)
	log.Fatal(app.Listen(":4000"))
}
