import type Redis from 'ioredis';

export async function warmJsonCache<T>({
  client,
  key,
  value,
  ttlSeconds,
}: {
  client: Redis;
  key: string;
  value: T;
  ttlSeconds?: number;
}): Promise<void> {
  const serializedValue = JSON.stringify(value);

  if (ttlSeconds && ttlSeconds > 0) {
    await client.set(key, serializedValue, 'EX', ttlSeconds);
    return;
  }

  await client.set(key, serializedValue);
}

export async function getJsonCache<T>(
  client: Redis,
  key: string,
): Promise<T | null> {
  const raw = await client.get(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteCacheKeys(
  client: Redis,
  ...keys: string[]
): Promise<void> {
  if (!keys.length) {
    return;
  }

  await client.del(...keys);
}

function serializeHashValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function tryParseHashValue<T = unknown>(value: string): T | string {
  try {
    return JSON.parse(value) as T;
  } catch {
    return value;
  }
}

export async function setHashFields<T extends Record<string, unknown>>({
  client,
  key,
  value,
  ttlSeconds,
}: {
  client: Redis;
  key: string;
  value: T;
  ttlSeconds?: number;
}): Promise<void> {
  const serialized: Record<string, string> = {};

  for (const [field, fieldValue] of Object.entries(value)) {
    serialized[field] = serializeHashValue(fieldValue);
  }

  await client.hset(key, serialized);

  if (ttlSeconds && ttlSeconds > 0) {
    await client.expire(key, ttlSeconds);
  }
}

export async function getHashFields<T extends Record<string, unknown>>(
  client: Redis,
  key: string,
): Promise<T | null> {
  const exists = await client.exists(key);

  if (!exists) {
    return null;
  }

  const raw = await client.hgetall(key);
  const parsed: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(raw)) {
    parsed[field] = tryParseHashValue(value);
  }

  return parsed as T;
}

export async function incrementHashField({
  client,
  key,
  field,
  by = 1,
}: {
  client: Redis;
  key: string;
  field: string;
  by?: number;
}): Promise<number> {
  return await client.hincrby(key, field, by);
}
