import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppLogger } from '../app.logger';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private isShuttingDown = false;
  private clientInstance: Redis | null = null;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  get client(): Redis {
    if (!this.clientInstance) {
      throw new Error('Redis client is not initialized');
    }
    return this.clientInstance;
  }
  async onModuleInit(): Promise<void> {
    const env = this.configService.get<string>('ENV', 'dev');

    const host =
      env === 'dev'
        ? '127.0.0.1'
        : this.configService.get<string>('REDIS_HOST');

    const port =
      env === 'dev' ? 6379 : this.configService.get<number>('REDIS_PORT', 6379);

    const password =
      env === 'dev' ? '' : this.configService.get<string>('REDIS_PASSWORD', '');

    const db =
      env === 'dev' ? 0 : this.configService.get<number>('REDIS_DB', 0);

    const upstashUrl =
      env === 'dev'
        ? undefined
        : this.configService.get<string>('UPSTASH_REDIS_URL');

    const connectTimeoutMs =
      this.configService.get<number>('REDIS_CONNECT_TIMEOUT_SECONDS', 5) * 1000;

    const maxRetries = Math.max(
      this.configService.get<number>('REDIS_MAX_RETRIES', 5),
      1,
    );

    const retryDelayMs =
      this.configService.get<number>('REDIS_RETRY_DELAY_SECONDS', 2) * 1000;

    const cooldownMs =
      this.configService.get<number>('REDIS_COOLDOWN_SECONDS', 30) * 1000;

    const target =
      env === 'dev'
        ? `redis://${host}:${port}/${db}`
        : `${'cant expose prod_url'}`;

    this.logger.log(`🧭 [Redis] Environment: ${env}`, 'RedisService');
    this.logger.log(`🔗 [Redis] Target: ${target}`, 'RedisService');
    this.logger.log(`🗂️ [Redis] DB: ${db}`, 'RedisService');

    while (!this.isShuttingDown) {
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          this.logger.log(
            `🟡 [Redis] Attempt ${attempt}/${maxRetries} -> ${target}`,
            'RedisService',
          );
          if (this.clientInstance) {
            this.clientInstance.disconnect();
            this.clientInstance = null;
          }
          this.clientInstance = upstashUrl
            ? new Redis(upstashUrl, {
                lazyConnect: true,
                connectTimeout: connectTimeoutMs,
                maxRetriesPerRequest: 1,
              })
            : new Redis({
                host,
                port,
                password: password || undefined,
                db,
                lazyConnect: true,
                connectTimeout: connectTimeoutMs,
                maxRetriesPerRequest: 1,
              });
          this.bindEvents(this.clientInstance);

          await this.clientInstance.connect();
          await this.clientInstance.ping();

          this.logger.log(`✅ [Redis] Connected -> ${target}`, 'RedisService');
          return;
        } catch (error: unknown) {
          const trace = error instanceof Error ? error.stack : undefined;
          const message =
            error instanceof Error ? error.message : 'unkown redis error';
          this.logger.error(
            `❌ [Redis] Attempt ${attempt}/${maxRetries} failed -> ${target} | ${message}`,
            trace,
            'RedisService',
          );
          if (attempt < maxRetries) {
            this.logger.warn(
              `⏳ [Redis] Retrying in ${retryDelayMs / 1000}s`,
              'RedisService',
            );
            await this.sleep(retryDelayMs);
          }
        }
      }
      this.logger.warn(
        `🧊 [Redis] All ${maxRetries} attempts failed for ${target}. Cooling down for ${cooldownMs / 1000}s`,
        'RedisService',
      );
      await this.sleep(cooldownMs);
    }
  }
  async onApplicationShutdown(): Promise<void> {
    this.isShuttingDown = true;
    if (this.clientInstance) {
      await this.clientInstance.quit();
      this.logger.log('🔌 [Redis] Connection closed', 'RedisService');
    }
  }
  isConnected(): boolean {
    return this.clientInstance?.status === 'ready';
  }
  private bindEvents(client: Redis): void {
    client.on('connect', () => {
      this.logger.log('🪝 [Redis] connect event fired', 'RedisService');
    });

    client.on('ready', () => {
      this.logger.log('🟢 [Redis] ready event fired', 'RedisService');
    });

    client.on('error', (error: Error) => {
      this.logger.error(
        `🔴 [Redis] error event: ${error.message}`,
        error.stack,
        'RedisService',
      );
    });

    client.on('close', () => {
      this.logger.warn('🟠 [Redis] close event fired', 'RedisService');
    });

    client.on('reconnecting', () => {
      this.logger.warn('🔄 [Redis] reconnecting', 'RedisService');
    });
  }
  private async sleep(ms: number): Promise<void> {
    if (ms <= 0 || this.isShuttingDown) {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
