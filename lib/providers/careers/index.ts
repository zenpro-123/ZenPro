import type { DataProvider } from "@/lib/providers/base";
import type { CareerOpportunity } from "@/types/content";
import { remoteOkProvider } from "@/lib/providers/careers/remoteok";
import { unstopProvider } from "@/lib/providers/careers/unstop";

export { remoteOkProvider } from "@/lib/providers/careers/remoteok";
export { unstopProvider } from "@/lib/providers/careers/unstop";

/** All providers backing Career Radar (Module 10) — RemoteOK live, Unstop stubbed for V2. */
export const careerProviders: DataProvider<CareerOpportunity>[] = [remoteOkProvider, unstopProvider];
