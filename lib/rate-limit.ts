interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  interval: number;
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  function evictExpired() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }

  if (typeof setInterval !== "undefined") {
    setInterval(evictExpired, 60_000);
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + interval });
        return { success: true, remaining: limit - 1, reset: now + interval };
      }

      entry.count++;

      if (entry.count > limit) {
        return { success: false, remaining: 0, reset: entry.resetAt };
      }

      return { success: true, remaining: limit - entry.count, reset: entry.resetAt };
    },
  };
}
