package common

type CountKeysRequest struct {
	DataStructureType string `json:"data_structure_type" validate:"required, min=3, max=10"`
}

type SetTTLRequest struct {
	TTL int64 `json:"ttl" validate:"required, min=1"`
}
