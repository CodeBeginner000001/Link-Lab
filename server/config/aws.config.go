package config

import "log"

type AWSConfig struct {
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	SQSQueueURL     string
	SQSQueueARN     string
}

func LoadAWSConfig() AWSConfig {
	cfg := AWSConfig{
		Region:          GetEnv("AWS_REGION", "ap-south-1"),
		AccessKeyID:     GetEnv("AWS_ACCESS_KEY_ID", ""),
		SecretAccessKey: GetEnv("AWS_SECRET_ACCESS_KEY", ""),
		SQSQueueURL:     GetEnv("AWS_SQS_EMAIL_QUEUE_URL", ""),
		SQSQueueARN:     GetEnv("AWS_SQS_EMAIL_QUEUE_ARN", ""),
	}

	if cfg.Region == "" {
		log.Fatal("AWS_REGION is not set")
	}

	return cfg
}