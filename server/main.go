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
)

func main() {
	logger.Init()
	defer logger.Sync()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db.ConnectMongo()
	db.ConnectRedis()

	sqsClient := sqs.NewClient(ctx)
	sqs.SetClient(sqsClient)

	app := fiber.New(fiber.Config{
		AppName: "LinkLab Auth API",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			if appErr, ok := err.(*http.AppError); ok {
				return c.Status(appErr.StatusCode).JSON(fiber.Map{
					"success": false,
					"message": appErr.Message,
					"errors":  appErr.Fields,
				})
			}

			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Internal server error",
			})
		},
	})

	app.Use(middlewares.PanicRecovery())
	routes.RegisterRoutes(app)
	log.Fatal(app.Listen(":4000"))

}
