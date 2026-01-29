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
		return "password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
	default:
		return "is invalid"
	}
}
