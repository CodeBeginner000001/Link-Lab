package http


func Sucess(message string) *AppError {
	return &AppError{
		StatusCode: 200,
		Message:    message,
	}
}

func BadRequest(message string) *AppError {
	return &AppError{
		StatusCode: 400,
		Message:    message,
	}
}

func UnAuthorized(message string) *AppError {
	return &AppError{
		StatusCode: 401,
		Message:    message,
	}
}

func Forbidden(message string) *AppError {
	return &AppError{
		StatusCode: 403,
		Message:    message,
	}
}

func NotFound(message string) *AppError {
	return &AppError{
		StatusCode: 404,
		Message:    message,
	}
}

func Conflict(message string) *AppError {
	return &AppError{
		StatusCode: 409,
		Message:    message,
	}
}

func Gone(message string) *AppError {
	return &AppError{
		StatusCode: 410,
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

func TooManyRequests(message string) *AppError {
	return &AppError{
		StatusCode: 429,
		Message:    message,
	}
}

func ServiceUnavailable(message string) *AppError {
	return &AppError{
		StatusCode: 503,
		Message:    message,
	}
}

func InternalServerError(message string) *AppError {
	return &AppError{
		StatusCode: 500,
		Message:    message,
	}
}

func InvalidRequestBody() *AppError {
	return &AppError{
		StatusCode: 400,
		Message:    "Invalid Data",
	}
}
