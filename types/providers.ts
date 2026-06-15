export interface ProviderConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  rateLimit?: number
  cacheTTL?: number
  isStub?: boolean
  availableIn?: 'v1' | 'v2' | 'v3'
}

export type ProviderStatus = 'ok' | 'degraded' | 'error' | 'stub' | 'disabled'

export interface ProviderResult<T> {
  data: T[]
  source: string
  fetchedAt: Date
  cached: boolean
  error?: string
  providerStatus: ProviderStatus
}

export interface ProviderHealth {
  healthy: boolean
  latencyMs?: number
  message?: string
  lastChecked: Date
}

export interface DataProvider<T, TConfig extends ProviderConfig = ProviderConfig> {
  readonly config: TConfig
  fetch(params?: Record<string, unknown>): Promise<ProviderResult<T>>
  healthCheck(): Promise<ProviderHealth>
}

export interface MarketItem {
  symbol: string
  name: string
  assetType: 'crypto' | 'index' | 'commodity' | 'forex' | 'stock'
  price: number
  change24h: number
  changePercent: number
  volume?: number
  marketCap?: number
  currency: string
}

export interface MarketProviderConfig extends ProviderConfig {
  baseUrl: string
  supportedSymbols: string[]
}

export interface MarketProvider extends DataProvider<MarketItem, MarketProviderConfig> {
  getSupportedSymbols(): string[]
  getPrice(symbol: string): Promise<MarketItem | null>
}

export interface SocialPost {
  id: string
  platform: 'x' | 'instagram' | 'reddit' | 'youtube'
  content: string
  author: string
  url?: string
  engagement: number
  sentiment?: 'positive' | 'neutral' | 'negative'
  fetchedAt: Date
}

export interface SocialTrendItem {
  topic: string
  platform: 'x' | 'instagram' | 'reddit' | 'youtube'
  velocity: 'rising' | 'stable' | 'falling'
  volume: number
  description?: string
  topPosts?: SocialPost[]
  fetchedAt: Date
}

export interface SocialProviderConfig extends ProviderConfig {
  platform: 'x' | 'instagram' | 'reddit' | 'youtube'
}

export interface SocialProvider extends DataProvider<SocialTrendItem, SocialProviderConfig> {
  getPlatform(): 'x' | 'instagram' | 'reddit' | 'youtube'
}
