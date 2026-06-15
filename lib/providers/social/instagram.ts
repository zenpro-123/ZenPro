import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { isEnabled } from "@/config/features";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { SocialTrend } from "@/types/content";

/**
 * Instagram trend intelligence — Module 5, deferred to V2. API-ready stub:
 * fully typed and registered in the provider architecture, disabled until
 * `INSTAGRAM_INTEGRATION` is enabled and scraping infrastructure is in place
 * (Instagram has no official public trends API).
 */
export class InstagramProvider extends BaseProvider<SocialTrend> {
  readonly config: ProviderConfig = {
    id: "instagram",
    name: "Instagram",
    description: "Trending hashtags and creator activity from Instagram",
    enabled: isEnabled("INSTAGRAM_INTEGRATION"),
    cacheTTLSeconds: CACHE_TTL.SOCIAL_TRENDS,
    requiresAuth: true,
  };

  async fetch(): Promise<ProviderResult<SocialTrend>> {
    return this.stub("Instagram integration requires scraping infrastructure — coming in V2.");
  }
}

export const instagramProvider = new InstagramProvider();
