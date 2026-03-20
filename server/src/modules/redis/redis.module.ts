import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisStringService } from './redis-string.service';
import { RedisStringController } from './redis-string.controller';
import { RedisService } from 'src/common/db/redis.service';
import { AppLogger } from 'src/common/app.logger';
import { RedisHashController } from './redis-hash.controller';
import { RedisHashService } from './redis-hash.service';

@Module({
  imports: [ConfigModule],
  controllers: [RedisStringController, RedisHashController],
  providers: [RedisService, RedisStringService, AppLogger, RedisHashService],
  exports: [RedisService, RedisStringService, RedisHashService],
})
export class RedisModule {}
