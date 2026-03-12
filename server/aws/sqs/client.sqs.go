package sqs

import (
	"context"
	"log"
	linklab_config "linklab-server/config"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	awssqs "github.com/aws/aws-sdk-go-v2/service/sqs"
)

var client *awssqs.Client

func NewClient(ctx context.Context) *awssqs.Client {
	awsCfg:= linklab_config.LoadAWSConfig()
	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion(awsCfg.Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				awsCfg.AccessKeyID,
				awsCfg.SecretAccessKey,
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
