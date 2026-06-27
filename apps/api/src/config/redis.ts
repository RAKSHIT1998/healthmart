import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let client: Redis | null = null;
let hasWarnedMissingConfig = false;

/**
 * Returns a shared ioredis client, or null when REDIS_URL isn't configured.
 * Every caller must treat a null return as "caching is disabled" and fall
 * back to hitting the database directly — Redis is a performance layer, not
 * a dependency the app should fail without.
 */
export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    if (!hasWarnedMissingConfig) {
      logger.warn('[Redis not configured] REDIS_URL is unset — running without a cache layer');
      hasWarnedMissingConfig = true;
    }
    return null;
  }

  if (client) return client;

  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    lazyConnect: false,
  });

  client.on('error', (err) => logger.error({ err }, 'Redis client error'));
  client.on('connect', () => logger.info('Redis connected'));

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
