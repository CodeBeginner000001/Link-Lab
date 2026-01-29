package hash

type CreateHashRequest struct {
	Key string `json:"key" validate:"required,min=1"`

	Fields map[string]string `json:"fields" validate:"required,min=1"`

	TTL int64 `json:"ttl" validate:"required,gte=1"`
}

type SetORUpdateFieldRequest struct {
	Field string `json:"field" validate:"required,min=1"`
	Value string `json:"value" validate:"required"`
}