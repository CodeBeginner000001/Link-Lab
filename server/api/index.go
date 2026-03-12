package handler

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"linklab-server/app"
	"linklab-server/logger"

	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

var (
	once    sync.Once
	handler http.HandlerFunc
	initErr error
)

func initHandler() {
	defer func() {
		if recovered := recover(); recovered != nil {
			initErr = fmt.Errorf("app bootstrap panic: %v", recovered)
			logger.Error("Vercel handler initialization failed", initErr)
		}
	}()

	handler = adaptor.FiberApp(app.New(context.Background()))
}

// Handler is the Vercel serverless entrypoint.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initHandler)
	if initErr != nil || handler == nil {
		http.Error(w, "Service initialization failed", http.StatusInternalServerError)
		return
	}
	defer logger.Sync()
	handler(w, r)
}
