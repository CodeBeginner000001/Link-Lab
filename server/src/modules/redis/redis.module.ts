import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppLogger } from 'src/common/app.logger';
import { RedisService } from 'src/common/db/redis.service';
import { InternalApiMiddleware } from 'src/middleware/internal-api.middleware';
import { RedisHashController } from './redis-hash.controller';
import { RedisHashService } from './redis-hash.service';
import { RedisStringController } from './redis-string.controller';
import { RedisStringService } from './redis-string.service';

@Module({
  imports: [ConfigModule],
  controllers: [RedisStringController, RedisHashController],
  providers: [RedisService, RedisStringService, AppLogger, RedisHashService],
  exports: [RedisService, RedisStringService, RedisHashService],
})
export class RedisModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(InternalApiMiddleware)
      .forRoutes(RedisStringController, RedisHashController);
  }
}
