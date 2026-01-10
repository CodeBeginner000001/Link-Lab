package redis

type CreateHashRequest struct { // expected request body DTO (Data Transfer Object)
	Key    string            `json:"key"`
	Fields map[string]string `json:"fields"` // field-value pairs
	TTL    int64             `json:"ttl"`
}

type UpdateHashRequest struct {
	Fields map[string]string `json:"fields"`
}

type SetORUpdateFieldRequest struct {
	Field string `json:"field"`
	Value string `json:"value"`
}

type SetTTLRequest struct {
	TTL int64 `json:"ttl"`
}

type CountKeysRequest struct {
	DataStructureType string `json:"data_structure_type"`
}

type CreateStringRequest struct {
	Key string `json:"key"`
	Value string `json:"value"`
	TTL int64   `json:"ttl"`
}

type UpdateStringRequest struct {
	Value string `json:"value"`
	TTL int64   `json:"ttl"`
}

type AppendStringRequest struct {
	Value string `json:"value"`
}