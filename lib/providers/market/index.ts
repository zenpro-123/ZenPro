import type { DataProvider } from "@/lib/providers/base";
import type { MarketItem } from "@/types/market";
import { coinGeckoProvider } from "@/lib/providers/market/coingecko";
import { yahooFinanceProvider } from "@/lib/providers/market/yahoo";

export { coinGeckoProvider } from "@/lib/providers/market/coingecko";
export { yahooFinanceProvider } from "@/lib/providers/market/yahoo";

/** All providers backing Market Pulse (Module 16) — crypto via CoinGecko, everything else via Yahoo Finance. */
export const marketProviders: DataProvider<MarketItem>[] = [coinGeckoProvider, yahooFinanceProvider];
