export type AssetType = "index" | "crypto" | "commodity" | "forex";

/** A single market quote, normalized across providers (CoinGecko, Yahoo Finance, ...). */
export interface MarketItem {
  symbol: string;
  displaySymbol: string;
  name: string;
  assetType: AssetType;
  price: number;
  change24h: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  currency: string;
  recordedAt: string;
}

export interface MarketInsight {
  summary: string;
  watchItems: string[];
  generatedAt: string;
}
