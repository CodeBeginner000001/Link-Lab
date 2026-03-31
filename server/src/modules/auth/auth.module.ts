import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/models/user.schema';
import { SqsModule } from 'src/services/aws/sqs/sqs.module';
import { RedisHashService } from '../redis/redis-hash.service';
import { RedisStringService } from '../redis/redis-string.service';
import { AuthFlowConfigService } from './auth-config.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForgotPasswordFlowService } from './forget-password-flow.service';
import { NotificationService } from './notification.service';
import { SignupFlowService } from './signup-flow.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    SqsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthFlowConfigService,
    AuthService,
    TokenService,
    NotificationService,
    SignupFlowService,
    ForgotPasswordFlowService,
    RedisStringService,
    RedisHashService,
  ],
})
export class AuthModule {}
