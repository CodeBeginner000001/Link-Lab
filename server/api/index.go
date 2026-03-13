package handler

import (
	"net/http"

	"linklab-server/vercel"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	vercel.ServeHTTP(w, r)
}
