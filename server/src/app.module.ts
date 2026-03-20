import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { AppLogger } from './common/app.logger';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validator';
import { DbModule } from './common/db/db.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { SuccessResponseInterceptor } from './interceptors/success-response.interceptor';
import { AvatarModule } from './modules/avatar/avatar.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
    DbModule,
    AuthModule,
    AvatarModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseInterceptor,
    },
    AppService,
    AppLogger,
  ],
  exports: [AppLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
