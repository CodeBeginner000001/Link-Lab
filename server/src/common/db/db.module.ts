import { Global, Module } from '@nestjs/common';
import { AppLogger } from '../app.logger';
import { RedisService } from './redis.service';
import { MongoModule } from './mongo.module';
import { MongoService } from './mongo.service';

@Global()
@Module({
  imports: [MongoModule],
  providers: [AppLogger, RedisService, MongoService],
  exports: [AppLogger, MongoModule, MongoService, RedisService],
})
export class DbModule {}
