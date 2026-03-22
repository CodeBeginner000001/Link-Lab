// src/aws/sqs/sqs.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SqsService } from './sqs.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'AWS_SQS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new SQSClient({
          region: configService.get<string>('AWS_REGION'),
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID', ''),
            secretAccessKey: configService.get<string>(
              'AWS_SECRET_ACCESS_KEY',
              '',
            ),
          },
        });
      },
    },
    SqsService,
  ],
  exports: [SqsService],
})
export class SqsModule {}
