package vercel

import (
	"net/http"
	"strings"

	"linklab-server/app"

	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

func ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fiberApp, err := app.Build()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if strings.HasPrefix(r.URL.Path, "/api/") {
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api")
	} else if r.URL.Path == "/api" {
		r.URL.Path = "/"
	}

	adaptor.FiberApp(fiberApp).ServeHTTP(w, r)
}
