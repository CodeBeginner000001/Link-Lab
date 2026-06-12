// src/cron/cron.controller.ts
import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { CronJobService } from './cron-job.service';
import { ConfigService } from '@nestjs/config';

@Controller('v1/api/cron')
export class CronController {
  readonly cronString: string | undefined;
  constructor(
    private readonly cronService: CronJobService,
    private readonly configService: ConfigService,
  ) {
    this.cronString = this.configService.getOrThrow<string>('CRON_SECRET');
  }

  @Public()
  @Get('url-shortener')
  @HttpCode(HttpStatus.OK)
  async dailyCleanup(@Headers('authorization') authorization?: string) {
    this.assertAuthorized(authorization);

    const result =
      await this.cronService.flushShortedURLRedisAnalyticsToMongo();

    return {
      success: true,
      message: 'Cron executed successfully',
      result,
      ranAt: new Date().toISOString(),
    };
  }

  private assertAuthorized(authorization?: string) {
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authorization !== expected) {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
