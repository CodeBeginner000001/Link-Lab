package mongoerror

import "errors"

var (
	ErrMongoUnavailable = errors.New("MongoDB service is unavailable")

	ErrMongoTimeout     = errors.New("MongoDB operation timed out")
	ErrDocumentNotFound = errors.New("Requested document was not found")
	ErrInvalidObjectID  = errors.New("Invalid MongoDB object id")
	ErrInvalidQuery     = errors.New("Invalid MongoDB query")
	ErrDecodeFailed     = errors.New("Failed to decode MongoDB document")
	ErrUnauthorized     = errors.New("Unauthorized MongoDB access")
	ErrMongoInternal    = errors.New("Internal MongoDB error")
)
