import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { MARKET_SYMBOLS } from "@/config/sources";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { MarketItem } from "@/types/market";

type CoinGeckoPrice = {
  usd: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
  usd_market_cap?: number;
};

/** Crypto leg of Market Pulse (Module 16) — BTC/ETH spot prices via CoinGecko's free API. */
export class CoinGeckoProvider extends BaseProvider<MarketItem> {
  readonly config: ProviderConfig = {
    id: "coingecko",
    name: "CoinGecko",
    description: "Crypto prices (BTC, ETH)",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.MARKET,
  };

  async fetch(): Promise<ProviderResult<MarketItem>> {
    try {
      const ids = MARKET_SYMBOLS.crypto.map((c) => c.symbol).join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko API error (${res.status})`);

      const body = (await res.json()) as Record<string, CoinGeckoPrice>;
      const recordedAt = new Date().toISOString();

      const items: MarketItem[] = MARKET_SYMBOLS.crypto.flatMap((coin) => {
        const price = body[coin.symbol];
        if (!price) return [];

        const changePercent = price.usd_24h_change ?? 0;
        // CoinGecko only reports the 24h % change — derive the absolute delta from it.
        const change24h = price.usd * (changePercent / (100 + changePercent));

        return [
          {
            symbol: coin.displaySymbol,
            displaySymbol: coin.displaySymbol,
            name: coin.name,
            assetType: "crypto",
            price: price.usd,
            change24h,
            changePercent,
            volume: price.usd_24h_vol,
            marketCap: price.usd_market_cap,
            currency: "USD",
            recordedAt,
          },
        ];
      });

      return this.ok(items);
    } catch (err) {
      return this.fail(err);
    }
  }
}

export const coinGeckoProvider = new CoinGeckoProvider();
