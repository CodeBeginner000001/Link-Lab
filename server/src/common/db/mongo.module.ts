import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppLogger } from '../app.logger';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService, AppLogger],
      useFactory: (configService: ConfigService, logger: AppLogger) => {
        const env = configService.getOrThrow<string>('ENV');

        const mongoUrl =
          env === 'dev'
            ? 'mongodb://127.0.0.1:27017'
            : configService.getOrThrow<string>('MONGO_URI');

        const mongoDb =
          env === 'dev'
            ? 'linklab'
            : configService.get<string>('MONGO_DB', 'prod');

        const connectTimeoutMs =
          configService.getOrThrow<number>('MONGO_CONNECT_TIMEOUT_SECONDS') *
          1000;

        const maxRetries = Math.max(
          configService.getOrThrow<number>('MONGO_MAX_RETRIES'),
          1,
        );

        const retryDelayMs =
          configService.getOrThrow<number>('MONGO_RETRY_DELAY_SECONDS') * 1000;

        const compassString =
          env === 'dev'
            ? `${mongoUrl}/${mongoDb}`
            : `${'cant expose prod_url'}/${mongoDb}`;

        logger.log(`🧭 [Mongo] Environment: ${env}`, 'MongoModule');
        logger.log(`🔗 [Mongo] Target: ${compassString}`, 'MongoModule');
        logger.log(`🗂️ [Mongo] Database: ${mongoDb}`, 'MongoModule');

        return {
          uri: mongoUrl,
          dbName: mongoDb,
          serverSelectionTimeoutMS: connectTimeoutMs,
          connectTimeoutMS: connectTimeoutMs,

          retryAttempts: maxRetries,
          retryDelay: retryDelayMs,

          connectionFactory: (connection) => {
            logger.log(
              `🟡 [Mongo] Initializing connection listeners`,
              'MongoModule',
            );

            connection.on('connected', () => {
              logger.log(
                `✅ [Mongo] Connected -> ${compassString}`,
                'MongoModule',
              );
            });

            connection.on('open', () => {
              logger.log(`📂 [Mongo] Connection opened`, 'MongoModule');
            });

            connection.on('reconnected', () => {
              logger.warn(`🔁 [Mongo] Reconnected`, 'MongoModule');
            });

            connection.on('disconnecting', () => {
              logger.warn(`🟠 [Mongo] Disconnecting`, 'MongoModule');
            });

            connection.on('disconnected', () => {
              logger.warn(`🔌 [Mongo] Disconnected`, 'MongoModule');
            });

            connection.on('close', () => {
              logger.warn(`🚪 [Mongo] Connection closed`, 'MongoModule');
            });

            connection.on('error', (error: Error) => {
              logger.error(
                `❌ [Mongo] Connection error -> ${error.message}`,
                error.stack,
                'MongoModule',
              );
            });

            return connection;
          },

          // supported by @nestjs/mongoose source
          connectionErrorFactory: (error: Error) => {
            logger.error(
              `❌ [Mongo] Initial connection failed -> ${error.message}`,
              error.stack,
              'MongoModule',
            );
            return error;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
