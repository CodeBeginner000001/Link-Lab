import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { CronController } from './cron-job.controller';

@Module({
  controllers: [CronController],
  providers: [CronJobService],
})
export class CronJobModule {}
