import { getRedis } from "@/lib/redis/client";
import { memGet, memSet } from "@/lib/cache/memory";
import { dbCacheGet, dbCacheSet } from "@/lib/cache/supabase-cache";

export { CACHE_TTL } from "@/lib/cache/ttl";

/** TTL used to backfill the in-memory tier when a value is found in Redis or Supabase. */
const MEMORY_BACKFILL_TTL = 60;

/**
 * Read a JSON value from cache. Checks memory, then Redis (if configured), then
 * the Supabase `cache_entries` table. Returns `null` on a miss across all tiers —
 * caller should fall back to a live fetch.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const memHit = memGet<T>(key);
  if (memHit !== null) return memHit;

  const redis = getRedis();
  if (redis) {
    try {
      const value = await redis.get<T>(key);
      if (value !== null && value !== undefined) {
        memSet(key, value, MEMORY_BACKFILL_TTL);
        return value;
      }
    } catch {
      // fall through to Supabase
    }
  }

  const dbHit = await dbCacheGet<T>(key);
  if (dbHit !== null) {
    memSet(key, dbHit, MEMORY_BACKFILL_TTL);
    return dbHit;
  }

  return null;
}

/**
 * Write a JSON value to every configured cache tier (memory, Redis, Supabase) with
 * a TTL. All writes are best-effort — caching is an optimization, not a hard
 * dependency.
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  memSet(key, value, ttlSeconds);

  const redis = getRedis();
  await Promise.allSettled([
    redis ? redis.set(key, value, { ex: ttlSeconds }) : Promise.resolve(),
    dbCacheSet(key, value, ttlSeconds),
  ]);
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
