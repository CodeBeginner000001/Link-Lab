import { Global, Module } from '@nestjs/common';
import { AppLogger } from '../app.logger';
import { MongoService } from './mongo.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [AppLogger, MongoService, RedisService],
  exports: [MongoService, RedisService],
})
export class DbModule {}
