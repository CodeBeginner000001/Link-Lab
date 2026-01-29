package sqserror

import "errors"

var (
	ErrSQSSendFailed  = errors.New("Failed to send message to SQS")
	ErrSQSUnavailable = errors.New("SQS service is unavailable")
)
