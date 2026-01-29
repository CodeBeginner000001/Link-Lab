package sqs

import (
	"context"
	"linklab-server/errors/sqserror"
	"linklab-server/logger"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

func Send(
	ctx context.Context,
	client *sqs.Client,
	queueURL string,
	body string,
) error {

	out, err := client.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    &queueURL,
		MessageBody: &body,
	})

	if err != nil {
		logger.Error("SQS ERROR: %v", err)
		return sqserror.ErrSQSSendFailed
	}

	logger.Info("SQS push successfully", logger.F("MessageId", *out.MessageId), logger.F("Queue URL", queueURL))
	return nil
}
