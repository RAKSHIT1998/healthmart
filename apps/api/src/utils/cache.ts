import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';

const CACHE_PREFIX = 'buymedicines:';

/**
 * Cache-aside helper: returns the cached value for `key` if present, otherwise
 * calls `fetcher()`, caches the result for `ttlSeconds`, and returns it. If
 * Redis isn't configured or a request fails, falls straight through to
 * `fetcher()` — caching is strictly an optimization, never a correctness
 * dependency.
 */
export async function getOrSetCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const redis = getRedisClient();
  if (!redis) return fetcher();

  const fullKey = `${CACHE_PREFIX}${key}`;

  try {
    const cached = await redis.get(fullKey);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    logger.warn({ err, key }, 'Cache read failed, falling back to source');
  }

  const value = await fetcher();

  try {
    await redis.set(fullKey, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'Cache write failed');
  }

  return value;
}

/** Deletes every cached key matching `pattern` (e.g. "medicine:*"). Used to invalidate on writes. */
export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const fullPattern = `${CACHE_PREFIX}${pattern}`;

  try {
    const keys = await redis.keys(fullPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn({ err, pattern }, 'Cache invalidation failed');
  }
}
