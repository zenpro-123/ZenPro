import { getRedis } from "@/lib/redis/client";

/**
 * Read a JSON value from Redis. Returns `null` on cache miss, parse error,
 * or when Redis isn't configured (caller should fall back to a live fetch).
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

/**
 * Write a JSON value to Redis with a TTL. No-ops silently when Redis isn't
 * configured — caching is an optimization, not a hard dependency.
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Cache writes are best-effort.
  }
}

/**
 * Fetch-through cache: returns the cached value if present, otherwise calls
 * `loader`, caches the result, and returns it.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return { data: cached, cached: true };
  }

  const data = await loader();
  await setCached(key, data, ttlSeconds);
  return { data, cached: false };
}

/** Standard cache key/TTL conventions used across providers. */
export const CACHE_TTL = {
  MARKET: 5 * 60,
  TECH_NEWS: 30 * 60,
  GITHUB_TRENDING: 60 * 60,
  CAREERS: 60 * 60,
  MORNING_BRIEF: 24 * 60 * 60,
  AI_SUMMARY: 6 * 60 * 60,
  SOCIAL_TRENDS: 15 * 60,
  USER_PREFS: 60 * 60,
} as const;
