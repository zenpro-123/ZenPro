import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * Returns the Upstash Redis client, or `null` if it isn't configured.
 * Every caller must handle the `null` case so local dev works without Redis
 * (caching is simply skipped — modules fall back to live fetches).
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    client = null;
    return client;
  }

  client = new Redis({ url, token });
  return client;
}
