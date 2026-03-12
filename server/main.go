package main

import (
	"context"
	"fmt"
	"linklab-server/app"
	"linklab-server/config"
	"linklab-server/logger"
	"log"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	defer logger.Sync()

	server := app.New(ctx)

	port := config.GetEnv("PORT", "4000")
	log.Fatal(server.Listen(fmt.Sprintf(":%s", port)))
}
