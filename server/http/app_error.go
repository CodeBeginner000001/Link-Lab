package http

type FieldError struct {
	Field string `json:"field"`
	Error string `json:"error"`
}

type AppError struct {
	StatusCode int          `json:"-"`
	Message    string       `json:"message"`
	Fields     []FieldError `json:"fields,omitempty"`
	Code       string       `json:"code,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}
