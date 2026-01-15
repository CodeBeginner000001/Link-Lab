package sqs

import (
	"context"
	"log"

	awsConfig "linklab-server/config"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	awssqs "github.com/aws/aws-sdk-go-v2/service/sqs"
)

var client *awssqs.Client

func NewClient(ctx context.Context) *awssqs.Client {
	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion(awsConfig.AWSRegion),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				awsConfig.AWSAccessKeyID,
				awsConfig.AWSSecretAccessKey,
				"",
			),
		),
	)
	if err != nil {
		log.Panicf("aws config error: %v", err)
	}

	return awssqs.NewFromConfig(cfg)
}
func SetClient(c *awssqs.Client) {
	client = c
}

func GetClient() *awssqs.Client {
	if client == nil {
		panic("SQS client not initialized. Call SetClient() in main")
	}
	return client
}
