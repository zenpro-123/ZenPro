/** Standard cache key/TTL conventions used across providers and the intelligence layer. */
export const CACHE_TTL = {
  MARKET: 5 * 60,
  TECH_NEWS: 30 * 60,
  GITHUB_TRENDING: 60 * 60,
  CAREERS: 60 * 60,
  MORNING_BRIEF: 24 * 60 * 60,
  AI_SUMMARY: 6 * 60 * 60,
  SOCIAL_TRENDS: 15 * 60,
  USER_PREFS: 60 * 60,
  SNAPSHOT: 6 * 60 * 60,
  WHAT_CHANGED: 6 * 60 * 60,
  RECOMMENDATIONS: 60 * 60,
} as const;
