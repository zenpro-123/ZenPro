/**
 * Provider Architecture
 * ---------------------
 * Every external data source (market data, RSS feeds, GitHub, social platforms,
 * career boards, ...) is wrapped in a `DataProvider`. This gives ZenPro a single,
 * consistent contract for fetching, caching, health-checking, and — critically —
 * swapping implementations without touching consuming code.
 *
 * A provider with `config.enabled === false` is a *stub*: it implements the
 * full interface (so the UI and pipelines compile and render real empty states)
 * but returns no data along with a clear `error` message explaining what's
 * needed to activate it (credentials, scraping infra, etc.).
 */

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** Suggested Redis cache TTL for this provider's results. */
  cacheTTLSeconds?: number;
  requiresAuth?: boolean;
}

export interface ProviderResult<T> {
  data: T[];
  source: string;
  fetchedAt: string;
  cached: boolean;
  error?: string;
}

export interface ProviderHealth {
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

export interface DataProvider<T> {
  readonly config: ProviderConfig;
  fetch(params?: Record<string, unknown>): Promise<ProviderResult<T>>;
  healthCheck(): Promise<ProviderHealth>;
}

/** Shared scaffolding for concrete providers. */
export abstract class BaseProvider<T> implements DataProvider<T> {
  abstract readonly config: ProviderConfig;
  abstract fetch(params?: Record<string, unknown>): Promise<ProviderResult<T>>;

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const result = await this.fetch();
      return {
        healthy: !result.error,
        latencyMs: Date.now() - start,
        message: result.error,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Unknown provider error",
      };
    }
  }

  protected ok(data: T[], cached = false): ProviderResult<T> {
    return {
      data,
      source: this.config.id,
      fetchedAt: new Date().toISOString(),
      cached,
    };
  }

  /** Standard response for a disabled/stub provider. */
  protected stub(message: string): ProviderResult<T> {
    return {
      data: [],
      source: this.config.id,
      fetchedAt: new Date().toISOString(),
      cached: false,
      error: message,
    };
  }

  protected fail(err: unknown): ProviderResult<T> {
    return {
      data: [],
      source: this.config.id,
      fetchedAt: new Date().toISOString(),
      cached: false,
      error: err instanceof Error ? err.message : "Unknown provider error",
    };
  }
}

/** Run multiple providers and flatten/merge their results, tolerating failures. */
export async function fetchFromProviders<T>(
  providers: DataProvider<T>[],
  params?: Record<string, unknown>
): Promise<{ items: T[]; errors: { provider: string; error: string }[] }> {
  const results = await Promise.allSettled(
    providers.filter((p) => p.config.enabled).map((p) => p.fetch(params))
  );

  const items: T[] = [];
  const errors: { provider: string; error: string }[] = [];

  results.forEach((result, idx) => {
    const provider = providers.filter((p) => p.config.enabled)[idx];
    if (result.status === "fulfilled") {
      items.push(...result.value.data);
      if (result.value.error) {
        errors.push({ provider: provider.config.id, error: result.value.error });
      }
    } else {
      errors.push({
        provider: provider.config.id,
        error: result.reason instanceof Error ? result.reason.message : "Unknown error",
      });
    }
  });

  return { items, errors };
}
