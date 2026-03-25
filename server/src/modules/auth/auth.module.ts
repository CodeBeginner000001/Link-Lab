import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/models/user.schema';
import { SqsModule } from 'src/services/aws/sqs/sqs.module';
import { RedisHashService } from '../redis/redis-hash.service';
import { RedisStringService } from '../redis/redis-string.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    SqsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisStringService, RedisHashService],
})
export class AuthModule {}
