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

var (
	ErrAvatarMissing = errors.New("avatar is required")
	ErrNameRequired = errors.New("Name is required")
	ErrEmailRequired = errors.New("Email is required")
	ErrPasswordRequired = errors.New("Password is required")
	ErrUserExists = errors.New("User exists in db")
	ErrVerifingUserExistence = errors.New("Failed to verify user existence")
	ErrGeneratingUserAvatar = errors.New("Could not generate user avatar")
	ErrUserCreation = errors.New("Failed to create user")
	ErrFetch = errors.New("Failed to fetch details")
	ErrUpdate = errors.New("Failed to update document")
	ErrNotFound = errors.New("Document not found")
	ErrInvalidID = errors.New("Invalid document Id")
	ErrMissingFilter = errors.New("Filters are missing")
	ErrMissingUpdate = errors.New("Update are missing")
)
