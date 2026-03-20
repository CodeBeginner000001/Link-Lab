import { Module } from '@nestjs/common';
import { RedisStringService } from './redis-string.service';
import { RedisController } from './redis.controller';
import { RedisService } from 'src/common/db/redis.service';

@Module({
  controllers: [RedisController],
  providers: [RedisStringService, RedisService],
  exports: [RedisStringService, RedisService],
})
export class RedisModule {}
