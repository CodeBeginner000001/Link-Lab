import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose, { ConnectionStates } from 'mongoose';
import { AppLogger } from '../app.logger';

@Injectable()
export class MongoService implements OnModuleInit, OnApplicationShutdown {
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    const env = this.configService.get<string>('ENV', 'dev');

    const mongoUrl =
      env === 'dev'
        ? 'mongodb://127.0.0.1:27017'
        : this.configService.getOrThrow<string>('MONGO_URI');

    const mongoDb =
      env === 'dev'
        ? 'dev'
        : this.configService.get<string>('MONGO_DB', 'prod');

    const connectTimeoutMs =
      this.configService.get<number>('MONGO_CONNECT_TIMEOUT_SECONDS', 5) * 1000;

    const maxRetries = Math.max(
      this.configService.get<number>('MONGO_MAX_RETRIES', 5),
      1,
    );

    const retryDelayMs =
      this.configService.get<number>('MONGO_RETRY_DELAY_SECONDS', 2) * 1000;

    const cooldownMs =
      this.configService.get<number>('MONGO_COOLDOWN_SECONDS', 30) * 1000;

    const compassString =
      env === 'dev'
        ? `${mongoUrl}/${mongoDb}`
        : `${'cant expose prod_url'}/${mongoDb}`;

    this.logger.log(`🧭 [Mongo] Environment: ${env}`, 'MongoService');
    this.logger.log(`🔗 [Mongo] Target: ${compassString}`, 'MongoService');
    this.logger.log(`🗂️ [Mongo] Database: ${mongoDb}`, 'MongoService');

    while (!this.isShuttingDown) {
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          this.logger.log(
            `🟡 [Mongo] Attempt ${attempt}/${maxRetries} -> ${compassString}`,
            'MongoService',
          );

          await mongoose.connect(mongoUrl, {
            dbName: mongoDb,
            serverSelectionTimeoutMS: connectTimeoutMs,
            connectTimeoutMS: connectTimeoutMs,
          });

          this.logger.log(
            `✅ [Mongo] Connected -> ${compassString}`,
            'MongoService',
          );
          return;
        } catch (error: unknown) {
          const trace = error instanceof Error ? error.stack : undefined;
          const message =
            error instanceof Error ? error.message : 'Unknown connection error';

          this.logger.error(
            `❌ [Mongo] Attempt ${attempt}/${maxRetries} failed -> ${compassString} | ${message}`,
            trace,
            'MongoService',
          );

          if (attempt < maxRetries) {
            this.logger.warn(
              `⏳ [Mongo] Retrying in ${retryDelayMs / 1000}s`,
              'MongoService',
            );
            await this.sleep(retryDelayMs);
          }
        }
      }

      this.logger.warn(
        `🧊 [Mongo] All ${maxRetries} attempts failed for ${compassString}. Cooling down for ${cooldownMs / 1000}s`,
        'MongoService',
      );

      await this.sleep(cooldownMs);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (mongoose.connection.readyState !== ConnectionStates.disconnected) {
      await mongoose.connection.close();
      this.logger.log('🔌 [Mongo] Connection closed', 'MongoService');
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === ConnectionStates.connected;
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0 || this.isShuttingDown) {
      return;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
