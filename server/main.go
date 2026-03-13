package main

import (
	"fmt"
	"linklab-server/app"
	"linklab-server/config"
	"log"
)

func main() {
	app, err := app.Build()
	if err != nil {
		log.Fatal(err)
	}

	port := config.GetEnv("PORT", "4000")
	log.Fatal(app.Listen(fmt.Sprintf(":%s", port)))
}
