// src/cron/cron.controller.ts
import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CronJobService } from './cron-job.service';

@Controller('api/cron')
export class CronController {
  constructor(private readonly cronService: CronJobService) {}

  @Get('url-shortener')
  @HttpCode(HttpStatus.OK)
  async dailyCleanup(@Headers('authorization') authorization?: string) {
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authorization !== expected) {
      throw new UnauthorizedException('Unauthorized');
    }

    const result =
      await this.cronService.flushShortedURLRedisAnalyticsToMongo();

    return {
      success: true,
      message: 'Cron executed successfully',
      result,
      ranAt: new Date().toISOString(),
    };
  }
}
