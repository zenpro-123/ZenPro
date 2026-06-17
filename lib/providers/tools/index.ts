import type { DataProvider } from "@/lib/providers/base";
import type { Tool } from "@/types/content";
import { productHuntProvider } from "@/lib/providers/tools/producthunt";

/** Tool Spotlight providers (Phase 3B). Add future sources here — `fetchFromProviders` aggregates them. */
export const toolProviders: DataProvider<Tool>[] = [productHuntProvider];
