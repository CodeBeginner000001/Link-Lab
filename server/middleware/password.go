package middlewares

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

var v = validator.New()

func init() {
	v.RegisterValidation("password", func(fl validator.FieldLevel) bool {
		p := fl.Field().String()

		return regexp.MustCompile(`[A-Z]`).MatchString(p) &&
			regexp.MustCompile(`[a-z]`).MatchString(p) && 
			regexp.MustCompile(`[0-9]`).MatchString(p) && 
			regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(p)
	})
}
