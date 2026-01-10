package main

import (
	"linklab-server/db"
	"linklab-server/routes"
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "LinkLab Auth API",
	})
	db.ConnectRedis()
	routes.RegisterRoutes(app)
	log.Fatal(app.Listen(":4000"))

}
