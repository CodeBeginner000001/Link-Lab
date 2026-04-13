import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { CronController } from './cron-job.controller';
import { UrlShortenerModule } from '../features/urlShortener/urlShortener.module';

@Module({
  imports: [UrlShortenerModule],
  controllers: [CronController],
  providers: [CronJobService],
})
export class CronJobModule {}
