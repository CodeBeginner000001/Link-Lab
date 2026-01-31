package http

type FieldError struct {
	Field string `json:"field,omitempty"`
	Error string `json:"error,omitempty"`
}

type AppError struct {
	StatusCode int          `json:"-"`
	Message    string       `json:"message"`
	Fields     []FieldError `json:"fields,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}
