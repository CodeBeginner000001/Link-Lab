package utilserror

import "errors"

var (
	ErrInvalidCost   = errors.New("Invalid hashing cost configuration")
	ErrHashFailed    = errors.New("Hashing operation failed")
	ErrCompareFailed = errors.New("Hash comparison failed")

	ErrGeneratingRefreshToken = errors.New("Failed to generate refresh token")
	ErrGeneratingAccessToken  = errors.New("Failed to generate access token")

	ErrTokenExpired   = errors.New("token expired")
	ErrValidatingToken        = errors.New("Failed to validate token")

	ErrJSONMarshalFailed = errors.New("Failed to serialize data to json")
)
