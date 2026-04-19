import { Module } from '@nestjs/common';
import { QrCodeModule } from '../features/qrCode/qrCode.module';
import { UrlShortenerModule } from '../features/urlShortener/urlShortener.module';
import { CronController } from './cron-job.controller';
import { CronJobService } from './cron-job.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    UrlShortenerModule,
    QrCodeModule,
  ],
  controllers: [CronController],
  providers: [CronJobService],
})
export class CronJobModule {}
