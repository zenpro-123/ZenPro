import YahooFinance from "yahoo-finance2";
import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { MARKET_SYMBOLS } from "@/config/sources";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { AssetType, MarketItem } from "@/types/market";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TRACKED_SYMBOLS: { symbol: string; displaySymbol: string; name: string; assetType: AssetType }[] = [
  ...MARKET_SYMBOLS.indices.map((s) => ({ ...s, assetType: "index" as const })),
  ...MARKET_SYMBOLS.commodities.map((s) => ({ ...s, assetType: "commodity" as const })),
  ...MARKET_SYMBOLS.forex.map((s) => ({ ...s, assetType: "forex" as const })),
];

/** Yahoo prefixes forex pairs with the base currency (e.g. `INR=X` -> `USDINR=X`). */
function normalizeSymbol(symbol: string): string {
  return symbol.replace(/^USD/, "");
}

/** Indices/commodities/forex leg of Market Pulse (Module 16) via Yahoo Finance quotes. */
export class YahooFinanceProvider extends BaseProvider<MarketItem> {
  readonly config: ProviderConfig = {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    description: "Indices, commodities, and forex",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.MARKET,
  };

  async fetch(): Promise<ProviderResult<MarketItem>> {
    try {
      const quotes = await yahooFinance.quote(TRACKED_SYMBOLS.map((s) => s.symbol));
      const recordedAt = new Date().toISOString();

      const items: MarketItem[] = TRACKED_SYMBOLS.flatMap((tracked) => {
        const quote = quotes.find((q) => normalizeSymbol(q.symbol) === normalizeSymbol(tracked.symbol));
        if (!quote || quote.regularMarketPrice === undefined) return [];

        return [
          {
            symbol: tracked.displaySymbol,
            displaySymbol: tracked.displaySymbol,
            name: tracked.name,
            assetType: tracked.assetType,
            price: quote.regularMarketPrice,
            change24h: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            currency: quote.currency ?? "USD",
            recordedAt,
          },
        ];
      });

      // Localize commodities (gold/silver) to INR for an India-first audience.
      // We reuse the USD/INR rate already in this batch — deterministic and free.
      // Percentage change is currency-agnostic, so only price/abs-change convert.
      const usdInr = items.find((i) => i.symbol === "USD/INR")?.price;
      if (usdInr && usdInr > 0) {
        for (const item of items) {
          if (item.assetType === "commodity" && item.currency === "USD") {
            item.price *= usdInr;
            item.change24h *= usdInr;
            item.currency = "INR";
          }
        }
      }

      return this.ok(items);
    } catch (err) {
      return this.fail(err);
    }
  }
}

export const yahooFinanceProvider = new YahooFinanceProvider();
