package middlewares

import "github.com/go-playground/validator/v10"

func getValidationMessage(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email address"
	case "min":
		return "is too short"
	case "max":
		return "is too long"
	case "len":
		return "should be of exact length"
	case "gte":
		return "should be of greater than expected value"
	case "password":
		return "should be a mixture of Uppercase, Lowercase, Number, Special character"
	default:
		return "is invalid"
	}
}
