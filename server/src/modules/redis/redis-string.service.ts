import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from 'src/common/db/redis.service';

@Injectable()
export class RedisStringService {
  constructor(private readonly redisService: RedisService) {}
  private get client() {
    return this.redisService.client;
  }
  private async selectDb(db?: number): Promise<void> {
    if (db === undefined || db === null) return;
    if (!Number.isInteger(db) || db < 0) {
      throw new BadGatewayException('Invalid Redis DB index');
    }
    await this.client.select(db);
  }
  private serialize<T>(value: T): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }
  private tryParse<T>(value: string | null): T | string | null {
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value;
    }
  }
  private async writeUpdatedJson(
    key: string,
    value: Record<string, any>,
    ttlSeconds?: number,
    preserveTtl?: boolean,
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
      return;
    }

    if (preserveTtl) {
      const ttl = await this.client.ttl(key);

      await this.client.set(key, serialized);

      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
      return;
    }

    await this.client.set(key, serialized);
  }

  // create a key
  async create<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    db?: number,
  ): Promise<void> {
    await this.selectDb(db);
    const serialized = this.serialize(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(key, serialized);
  }
  // create a key if doesn't exists
  async createIfNotExists<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    db?: number,
  ): Promise<boolean> {
    await this.selectDb(db);
    const serialized = this.serialize(value);
    let result: 'OK' | null;
    if (ttlSeconds && ttlSeconds > 0) {
      result = await this.client.set(key, serialized, 'EX', ttlSeconds, 'NX');
    } else {
      result = await this.client.set(key, serialized, 'NX');
    }
    return result === 'OK';
  }
  // get a parsed value
  async get<T>(key: string, db?: number): Promise<T | string | null> {
    await this.selectDb(db);
    const value = await this.client.get(key);
    return this.tryParse<T>(value);
  }
  // get value without parsing
  async getRaw(key: string, db?: number): Promise<string | null> {
    await this.selectDb(db);
    return this.client.get(key);
  }
  // update key with new value
  async update<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    preserveTtl?: boolean,
    db?: number,
  ): Promise<void> {
    await this.selectDb(db);
    const exists = await this.client.exists(key);
    if (!exists) {
      throw new NotFoundException(`Redis key "${key}" not found`);
    }
    const serialized = this.serialize(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
      return;
    }
    if (preserveTtl) {
      const ttl = await this.client.ttl(key);
      await this.client.set(key, serialized);
      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
      return;
    }
    await this.client.set(key, serialized);
  }
  // delete a key
  async delete(key: string, db?: number): Promise<boolean> {
    await this.selectDb(db);
    const deleted = await this.client.del(key);
    return deleted > 0;
  }
  // check if key exists
  async exists(key: string, db?: number): Promise<boolean> {
    await this.selectDb(db);
    const exists = await this.client.exists(key);
    return exists > 0;
  }
  // get ttl of a key
  async getTtl(key: string, db?: number): Promise<number> {
    await this.selectDb(db);
    return this.client.ttl(key);
  }
  // rename key
  async rename(oldKey: string, newKey: string, db?: number): Promise<void> {
    await this.selectDb(db);
    await this.client.rename(oldKey, newKey);
  }
  // refresh expiry
  async expire(key: string, ttlSeconds: number, db?: number): Promise<boolean> {
    await this.selectDb(db);
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new BadRequestException(`ttlSeconds must be a positive integer`);
    }
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }
  // update fields
  async updateFields<T extends Record<string, any>>(
    key: string,
    updates: Partial<T>,
    db?: number,
    preserveTtl?: boolean,
    ttlSeconds?: number,
  ): Promise<T> {
    await this.selectDb(db);
    const current = await this.client.get(key);
    if (!current) {
      throw new NotFoundException(`Redis key "${key}" not found`);
    }
    let parsed: Record<string, T>;
    try {
      parsed = JSON.parse(current) as Record<string, T>;
    } catch {
      throw new BadRequestException(
        `Redis key "${key}" doesn't contain JSON object data`,
      );
    }
    const merged = {
      ...parsed,
      ...updates,
    };
    await this.writeUpdatedJson(key, merged, ttlSeconds, preserveTtl);
    return merged as T;
  }
}
