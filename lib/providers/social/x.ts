import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { isEnabled } from "@/config/features";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { SocialTrend } from "@/types/content";

/**
 * X (Twitter) trend intelligence — Module 7, deferred to V2. API-ready stub:
 * fully typed and registered in the provider architecture, disabled until
 * `X_INTEGRATION` is enabled and API v2 credentials are configured.
 */
export class XProvider extends BaseProvider<SocialTrend> {
  readonly config: ProviderConfig = {
    id: "x",
    name: "X (Twitter)",
    description: "Trending topics and headlines from X",
    enabled: isEnabled("X_INTEGRATION"),
    cacheTTLSeconds: CACHE_TTL.SOCIAL_TRENDS,
    requiresAuth: true,
  };

  async fetch(): Promise<ProviderResult<SocialTrend>> {
    return this.stub("X integration requires API v2 credentials — coming in V2.");
  }
}

export const xProvider = new XProvider();
