import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { CareerOpportunity } from "@/types/content";

/**
 * Hackathons, scholarships, and competitions (India) — Module 10. Unstop has
 * no public API, so this is an API-ready stub: fully typed, registered in the
 * provider architecture, disabled until scraping infrastructure lands in V2.
 */
export class UnstopProvider extends BaseProvider<CareerOpportunity> {
  readonly config: ProviderConfig = {
    id: "unstop",
    name: "Unstop",
    description: "Hackathons, scholarships, and competitions (India)",
    enabled: false,
    cacheTTLSeconds: CACHE_TTL.CAREERS,
    requiresAuth: true,
  };

  async fetch(): Promise<ProviderResult<CareerOpportunity>> {
    return this.stub("Unstop integration requires scraping infrastructure — coming in V2.");
  }
}

export const unstopProvider = new UnstopProvider();
