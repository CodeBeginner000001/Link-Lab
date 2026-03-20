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
  ): Promise<{ key: string; value: T; ttlSeconds?: number; db: number }> {
    await this.selectDb(db);
    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }
    const serialized = this.serialize(value);
    if (ttlSeconds !== undefined) {
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new BadRequestException('ttlSeconds must be a positive integer');
      }

      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
    return {
      key,
      value,
      ttlSeconds,
      db: db ?? 0,
    };
  }
  // create a key if doesn't exists
  async createIfNotExists<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    db?: number,
  ): Promise<{ created: boolean; key: string; db: number }> {
    await this.selectDb(db);
    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }
    const serialized = this.serialize(value);
    let result: 'OK' | null;
    if (ttlSeconds !== undefined) {
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new BadRequestException('ttlSeconds must be a positive integer');
      }

      result = await this.client.set(key, serialized, 'EX', ttlSeconds, 'NX');
    } else {
      result = await this.client.set(key, serialized, 'NX');
    }

    return {
      created: result === 'OK',
      key,
      db: db ?? 0,
    };
  }
  // get a parsed value
  async get<T>(
    key: string,
    db?: number,
  ): Promise<{ key: string; value: T | string | null; db: number }> {
    await this.selectDb(db);
    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const value = await this.client.get(key);

    return {
      key,
      value: this.tryParse<T>(value),
      db: db ?? 0,
    };
  }
  // get value without parsing
  async getRaw(
    key: string,
    db?: number,
  ): Promise<{ key: string; value: string | null; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const value = await this.client.get(key);

    return {
      key,
      value,
      db: db ?? 0,
    };
  }
  // update key with new value
  async update<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    preserveTtl?: boolean,
    db?: number,
  ): Promise<{ key: string; value: T; ttlSeconds?: number; db: number }> {
    await this.selectDb(db);
    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }
    const exists = await this.client.exists(key);
    if (!exists) {
      throw new NotFoundException(`Redis key "${key}" not found`);
    }
    const serialized = this.serialize(value);
    if (ttlSeconds !== undefined) {
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new BadRequestException('ttlSeconds must be a positive integer');
      }

      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else if (preserveTtl) {
      const ttl = await this.client.ttl(key);

      await this.client.set(key, serialized);

      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
    } else {
      await this.client.set(key, serialized);
    }

    return {
      key,
      value,
      ttlSeconds,
      db: db ?? 0,
    };
  }
  // update fields
  async updateFields<T extends Record<string, any>>(
    key: string,
    updates: Partial<T>,
    db?: number,
    preserveTtl?: boolean,
    ttlSeconds?: number,
  ): Promise<{ key: string; value: T; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const current = await this.client.get(key);
    if (!current) {
      throw new NotFoundException(`Redis key "${key}" not found`);
    }

    let parsed: Record<string, any>;

    try {
      parsed = JSON.parse(current) as Record<string, any>;
    } catch {
      throw new BadRequestException(
        `Redis key "${key}" does not contain JSON object data`,
      );
    }

    const merged = {
      ...parsed,
      ...updates,
    };

    await this.writeUpdatedJson(key, merged, ttlSeconds, preserveTtl);

    return {
      key,
      value: merged as T,
      db: db ?? 0,
    };
  }
  // delete a key
  async delete(
    key: string,
    db?: number,
  ): Promise<{ key: string; deleted: boolean; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const deleted = await this.client.del(key);

    return {
      key,
      deleted: deleted > 0,
      db: db ?? 0,
    };
  }
  // check if key exists
  async exists(
    key: string,
    db?: number,
  ): Promise<{ key: string; exists: boolean; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const exists = await this.client.exists(key);

    return {
      key,
      exists: exists > 0,
      db: db ?? 0,
    };
  }
  // get ttl of a key
  async getTtl(
    key: string,
    db?: number,
  ): Promise<{ key: string; ttl: number; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const ttl = await this.client.ttl(key);

    return {
      key,
      ttl,
      db: db ?? 0,
    };
  }
  // rename key
  async rename(
    oldKey: string,
    newKey: string,
    db?: number,
  ): Promise<{ oldKey: string; newKey: string; db: number }> {
    await this.selectDb(db);

    if (!oldKey?.trim()) {
      throw new BadRequestException('Old key is required');
    }

    if (!newKey?.trim()) {
      throw new BadRequestException('New key is required');
    }

    const exists = await this.client.exists(oldKey);
    if (!exists) {
      throw new NotFoundException(`Redis key "${oldKey}" not found`);
    }

    await this.client.rename(oldKey, newKey);

    return {
      oldKey,
      newKey,
      db: db ?? 0,
    };
  }
  // refresh expiry
  async expire(
    key: string,
    ttlSeconds: number,
    db?: number,
  ): Promise<{
    key: string;
    updated: boolean;
    ttlSeconds: number;
    db: number;
  }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new BadRequestException('ttlSeconds must be a positive integer');
    }

    const result = await this.client.expire(key, ttlSeconds);

    return {
      key,
      updated: result === 1,
      ttlSeconds,
      db: db ?? 0,
    };
  }
}
