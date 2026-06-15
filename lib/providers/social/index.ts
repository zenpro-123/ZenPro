import type { DataProvider } from "@/lib/providers/base";
import type { SocialTrend } from "@/types/content";
import { xProvider } from "@/lib/providers/social/x";
import { instagramProvider } from "@/lib/providers/social/instagram";

export { xProvider } from "@/lib/providers/social/x";
export { instagramProvider } from "@/lib/providers/social/instagram";

/** Providers backing Social Pulse (Module 7) — both stubbed pending V2 credentials/scraping infra. */
export const socialProviders: DataProvider<SocialTrend>[] = [xProvider, instagramProvider];
