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

export type DrainedShortUrlAnalytics = {
  count: string | null;
  lastClickedAt: string | null;
};

export async function recordShortUrlAnalyticsClick({
  client,
  key,
  clickedAt,
}: {
  client: Redis;
  key: string;
  clickedAt: string;
}): Promise<number> {
  const count = await client.eval(
    `
      local count = redis.call('HINCRBY', KEYS[1], 'count', 1)
      redis.call('HSET', KEYS[1], 'lastClickedAt', ARGV[1])
      return count
    `,
    1,
    key,
    clickedAt,
  );

  return Number(count);
}

export async function drainShortUrlAnalyticsHash({
  client,
  key,
}: {
  client: Redis;
  key: string;
}): Promise<DrainedShortUrlAnalytics | null> {
  const result = (await client.eval(
    `
      if redis.call('EXISTS', KEYS[1]) == 0 then
        return nil
      end

      local count = redis.call('HGET', KEYS[1], 'count')
      local lastClickedAt = redis.call('HGET', KEYS[1], 'lastClickedAt')

      redis.call('HSET', KEYS[1], 'count', '0', 'lastClickedAt', 'null')

      return { count, lastClickedAt }
    `,
    1,
    key,
  )) as [string | null, string | null] | null;

  if (!result) {
    return null;
  }

  return {
    count: result[0],
    lastClickedAt: result[1],
  };
}
