import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from 'src/common/db/redis.service';

@Injectable()
export class RedisHashService {
  constructor(private readonly redisService: RedisService) {}

  private get client() {
    return this.redisService.client;
  }

  private async selectDb(db?: number): Promise<void> {
    if (db === undefined || db === null) return;

    if (!Number.isInteger(db) || db < 0) {
      throw new BadRequestException('Invalid Redis DB index');
    }

    await this.client.select(db);
  }

  private serializeValue(value: unknown): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  private serializeHash(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      result[key] = this.serializeValue(value);
    }

    return result;
  }

  private tryParseValue<T = unknown>(value: string): T | string {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value;
    }
  }

  private parseHash<T extends Record<string, any>>(
    data: Record<string, string>,
  ): T {
    const parsed: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      parsed[key] = this.tryParseValue(value) as Record<string, any>;
    }

    return parsed as T;
  }

  private async setTtlIfProvided(
    key: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds === undefined) return;

    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new BadRequestException('ttlSeconds must be a positive integer');
    }

    await this.client.expire(key, ttlSeconds);
  }

  private async reapplyTtlIfNeeded(
    key: string,
    preserveTtl?: boolean,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.setTtlIfProvided(key, ttlSeconds);
      return;
    }

    if (!preserveTtl) return;

    const ttl = await this.client.ttl(key);
    if (ttl > 0) {
      await this.client.expire(key, ttl);
    }
  }

  async create<T extends Record<string, any>>(
    key: string,
    value: T,
    ttlSeconds?: number,
    db?: number,
  ): Promise<{ key: string; value: T; ttlSeconds?: number; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('value must be a valid object');
    }

    const serialized = this.serializeHash(value);
    await this.client.hset(key, serialized);
    await this.setTtlIfProvided(key, ttlSeconds);

    return {
      key,
      value,
      ttlSeconds,
      db: db ?? 0,
    };
  }

  async createIfNotExists<T extends Record<string, any>>(
    key: string,
    value: T,
    ttlSeconds?: number,
    db?: number,
  ): Promise<{ created: boolean; key: string; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('value must be a valid object');
    }

    const exists = await this.client.exists(key);
    if (exists) {
      return {
        created: false,
        key,
        db: db ?? 0,
      };
    }

    const serialized = this.serializeHash(value);
    await this.client.hset(key, serialized);
    await this.setTtlIfProvided(key, ttlSeconds);

    return {
      created: true,
      key,
      db: db ?? 0,
    };
  }

  async get<T extends Record<string, any>>(
    key: string,
    db?: number,
  ): Promise<{ key: string; value: T | null; db: number }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const exists = await this.client.exists(key);
    if (!exists) {
      return {
        key,
        value: null,
        db: db ?? 0,
      };
    }

    const data = await this.client.hgetall(key);

    return {
      key,
      value: this.parseHash<T>(data),
      db: db ?? 0,
    };
  }

  async getRaw(
    key: string,
    db?: number,
  ): Promise<{
    key: string;
    value: Record<string, string> | null;
    db: number;
  }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    const exists = await this.client.exists(key);
    if (!exists) {
      return {
        key,
        value: null,
        db: db ?? 0,
      };
    }

    const data = await this.client.hgetall(key);

    return {
      key,
      value: data,
      db: db ?? 0,
    };
  }

  async update<T extends Record<string, any>>(
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

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('value must be a valid object');
    }

    const exists = await this.client.exists(key);
    if (!exists) {
      throw new NotFoundException(`Redis hash "${key}" not found`);
    }

    const oldTtl =
      preserveTtl && ttlSeconds === undefined
        ? await this.client.ttl(key)
        : undefined;

    const currentFields = await this.client.hkeys(key);
    if (currentFields.length > 0) {
      await this.client.hdel(key, ...currentFields);
    }

    const serialized = this.serializeHash(value);
    await this.client.hset(key, serialized);

    if (ttlSeconds !== undefined) {
      await this.setTtlIfProvided(key, ttlSeconds);
    } else if (oldTtl !== undefined && oldTtl > 0) {
      await this.client.expire(key, oldTtl);
    }

    return {
      key,
      value,
      ttlSeconds,
      db: db ?? 0,
    };
  }

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

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new BadRequestException('updates must be a valid object');
    }

    const exists = await this.client.exists(key);
    if (!exists) {
      throw new NotFoundException(`Redis hash "${key}" not found`);
    }

    const serialized = this.serializeHash(updates as Record<string, any>);
    await this.client.hset(key, serialized);
    await this.reapplyTtlIfNeeded(key, preserveTtl, ttlSeconds);

    const updated = await this.client.hgetall(key);

    return {
      key,
      value: this.parseHash<T>(updated),
      db: db ?? 0,
    };
  }

  async deleteFields(
    key: string,
    fields: string[],
    db?: number,
  ): Promise<{
    key: string;
    deletedCount: number;
    remainingValue: Record<string, any> | null;
    db: number;
  }> {
    await this.selectDb(db);

    if (!key?.trim()) {
      throw new BadRequestException('Key is required');
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new BadRequestException('fields must be a non-empty array');
    }

    const validFields = fields.filter(
      (field) => typeof field === 'string' && field.trim(),
    );

    if (validFields.length === 0) {
      throw new BadRequestException('fields must contain valid field names');
    }

    const exists = await this.client.exists(key);
    if (!exists) {
      throw new NotFoundException(`Redis hash "${key}" not found`);
    }

    const deletedCount = await this.client.hdel(key, ...validFields);
    const remaining = await this.client.hgetall(key);

    return {
      key,
      deletedCount,
      remainingValue:
        Object.keys(remaining).length > 0 ? this.parseHash(remaining) : {},
      db: db ?? 0,
    };
  }

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
      throw new NotFoundException(`Redis hash "${oldKey}" not found`);
    }

    await this.client.rename(oldKey, newKey);

    return {
      oldKey,
      newKey,
      db: db ?? 0,
    };
  }
}
