/** RSS feed sources for Daily Tech Intelligence (Module 4). */
export const TECH_RSS_FEEDS = [
  { id: "theverge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { id: "geekwire", name: "GeekWire", url: "https://www.geekwire.com/feed/" },
  { id: "hackernews", name: "Hacker News", url: "https://hnrss.org/frontpage" },
] as const;

/** Learning sources (Phase 3B — tutorials & educational articles). */
export const LEARNING_RSS_FEEDS = [
  { id: "devto", name: "Dev.to", url: "https://dev.to/feed" },
  { id: "freecodecamp", name: "freeCodeCamp", url: "https://www.freecodecamp.org/news/rss/" },
  { id: "hackernews", name: "Hacker News", url: "https://hnrss.org/frontpage" },
] as const;

/** GitHub Search API config for trending repos (Module 12). */
export const GITHUB_TRENDING_CONFIG = {
  /** Repos created within this many days are eligible for "trending". */
  windowDays: 7,
  /** Minimum stars to qualify. */
  minStars: 50,
  perPage: 12,
};

/** Market symbols tracked by Market Pulse (Module 16), grouped by provider. */
export const MARKET_SYMBOLS = {
  crypto: [
    { symbol: "bitcoin", displaySymbol: "BTC", name: "Bitcoin" },
    { symbol: "ethereum", displaySymbol: "ETH", name: "Ethereum" },
  ],
  indices: [
    { symbol: "^NSEI", displaySymbol: "NIFTY 50", name: "Nifty 50" },
    { symbol: "^BSESN", displaySymbol: "SENSEX", name: "BSE Sensex" },
    { symbol: "^NSEBANK", displaySymbol: "NIFTY BANK", name: "Nifty Bank" },
    { symbol: "^IXIC", displaySymbol: "NASDAQ", name: "Nasdaq Composite" },
  ],
  commodities: [
    { symbol: "GC=F", displaySymbol: "GOLD", name: "Gold Futures" },
    { symbol: "SI=F", displaySymbol: "SILVER", name: "Silver Futures" },
  ],
  forex: [{ symbol: "INR=X", displaySymbol: "USD/INR", name: "US Dollar / Indian Rupee" }],
} as const;

/** Tool Spotlight sources (Phase 3B) — Product Hunt's public Atom feed (no auth). */
export const PRODUCT_HUNT_FEEDS = [
  { id: "producthunt", name: "Product Hunt", url: "https://www.producthunt.com/feed" },
] as const;

/** Career data sources (Module 10). */
export const CAREER_SOURCES = {
  remoteok: "https://remoteok.com/api",
} as const;

/** Reddit RSS used as a stable fallback for Social Pulse (Module 7, V2). */
export const SOCIAL_RSS_FEEDS = [
  { id: "reddit-technology", name: "r/technology", url: "https://www.reddit.com/r/technology/top/.rss?t=day" },
  { id: "reddit-india", name: "r/india", url: "https://www.reddit.com/r/india/top/.rss?t=day" },
] as const;
