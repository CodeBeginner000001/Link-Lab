import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SendMailQueueParams,
  EmailQueueMessage,
} from 'src/interfaces/aws-sqs.inerface';

@Injectable()
export class SqsService {
  private readonly queueUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('AWS_SQS_CLIENT') private readonly sqsClient: SQSClient,
  ) {
    this.queueUrl = this.configService.get<string>(
      'AWS_SQS_EMAIL_QUEUE_URL',
      '',
    );

    if (!this.queueUrl) {
      throw new Error('AWS_SQS_EMAIL_QUEUE_URL is not configured');
    }
  }

  async sendMail(params: SendMailQueueParams): Promise<{ messageId?: string }> {
    this.validateMessage(params);

    const payload: EmailQueueMessage = {
      type: params.type,
      to: params.to.trim(),
      subject: params.subject,
      template: params.template,
      html: params.html,
      context: params.context ?? {},
      meta: {
        source: params.meta?.source ?? 'Link Lab',
        project: 'LINK_LAB',
        senderName: 'Link Lab',
        senderLogo: 'https://linklab-solutions.vercel.app/logo.png',
        userId: params.meta?.userId,
        requestId: params.meta?.requestId,
      },
    };

    try {
      const response = await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(payload),
          MessageAttributes: {
            jobType: {
              DataType: 'String',
              StringValue: payload.type,
            },
            to: {
              DataType: 'String',
              StringValue: payload.to,
            },
            ...(payload.template
              ? {
                  template: {
                    DataType: 'String',
                    StringValue: payload.template,
                  },
                }
              : {}),
            ...(payload.subject
              ? {
                  subject: {
                    DataType: 'String',
                    StringValue: payload.subject,
                  },
                }
              : {}),
            project: {
              DataType: 'String',
              StringValue: payload.meta?.project ?? 'LINK_LAB',
            },
          },
        }),
      );

      return { messageId: response.MessageId };
    } catch {
      throw new InternalServerErrorException('Failed to queue email job');
    }
  }

  private validateMessage(params: SendMailQueueParams): void {
    if (!params.to?.trim()) {
      throw new BadRequestException('Email recipient is required');
    }

    if (!params.type) {
      throw new BadRequestException('Mail job type is required');
    }

    if (!params.template?.trim() && !params.html?.trim()) {
      throw new BadRequestException('Either template or html is required');
    }

    if (params.context && typeof params.context !== 'object') {
      throw new BadRequestException('Mail context must be an object');
    }
  }
}
