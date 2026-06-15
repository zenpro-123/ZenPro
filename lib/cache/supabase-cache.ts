import { createServiceClient } from "@/lib/supabase/server";

/**
 * Returns `true` if the service-role Supabase client can be constructed.
 * `createServiceClient()` non-null-asserts its env vars, so this must be
 * checked first — mirrors `getRedis()`'s graceful-degradation pattern.
 */
function isConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Read a JSON value from `public.cache_entries`. Returns `null` on cache miss,
 * expiry, error, or when the service role isn't configured.
 */
export async function dbCacheGet<T>(key: string): Promise<T | null> {
  if (!isConfigured()) return null;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cache_entries")
      .select("value, expires_at")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;

    return data.value as T;
  } catch {
    return null;
  }
}

/** Write a JSON value to `public.cache_entries` with a TTL. No-ops silently on failure. */
export async function dbCacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!isConfigured()) return;

  try {
    const supabase = createServiceClient();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await supabase.from("cache_entries").upsert({ key, value, expires_at: expiresAt });
  } catch {
    // Cache writes are best-effort.
  }
}
