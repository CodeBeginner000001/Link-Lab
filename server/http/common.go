package http


func NewBadRequest(message string) *AppError {
	return &AppError{
		StatusCode: 400,
		Message:    message,
	}
}

func ValidationError(field, message string) *AppError {
	return &AppError{
		StatusCode: 422,
		Message:    "Validation failed",
		Fields: []FieldError{
			{
				Field: field,
				Error: message,
			},
		},
	}
}

func InvalidRequestBody() *AppError {
	return &AppError{
		StatusCode: 400,
		Message:    "Invalid request body",
	}
}

func NotFound(message string) *AppError {
	return &AppError{
		StatusCode: 404,
		Message:    message,
	}
}

func UnAuthorized(message string) *AppError {
	return &AppError{
		StatusCode: 401,
		Message:    message,
	}
}

func Conflict(message string) *AppError {
	return &AppError{
		StatusCode: 409,
		Message:    message,
	}
}

func Internal(err error) *AppError {
	return &AppError{
		StatusCode: 500,
		Message:    err.Error(),
	}
}
