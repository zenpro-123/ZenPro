/** Module 1 — onboarding interest options. */
export const INTERESTS = [
  "Technology",
  "Artificial Intelligence",
  "Programming",
  "Cybersecurity",
  "Startups",
  "Business",
  "Finance",
  "Investing",
  "Gaming",
  "Sports",
  "Movies",
  "Science",
  "Space",
  "Productivity",
  "Design",
  "UI/UX",
  "India News",
  "World News",
  "Social Media Trends",
  "Creator Economy",
  "YouTube",
  "Instagram",
  "Twitter/X",
  "Cryptocurrency",
] as const;

export const COMPANIES = [
  "OpenAI",
  "Google",
  "Apple",
  "Meta",
  "Microsoft",
  "NVIDIA",
  "Tesla",
  "Anthropic",
] as const;

export const CREATORS = [
  "MrBeast",
  "Marques Brownlee",
  "Tech Burner",
  "Dhruv Rathee",
  "BeerBiceps",
  "CarryMinati",
] as const;

export type Interest = (typeof INTERESTS)[number];
export type Company = (typeof COMPANIES)[number];
export type Creator = (typeof CREATORS)[number];

/**
 * Maps each interest to the content categories it should boost.
 * Used to build the initial interest vector during onboarding.
 */
export const INTEREST_CATEGORY_MAP: Record<Interest, string[]> = {
  Technology: ["tech", "github"],
  "Artificial Intelligence": ["tech", "github", "tools"],
  Programming: ["tech", "github", "learning"],
  Cybersecurity: ["tech", "github"],
  Startups: ["startup", "career"],
  Business: ["startup", "market"],
  Finance: ["market"],
  Investing: ["market", "startup"],
  Gaming: ["social", "creator"],
  Sports: ["social"],
  Movies: ["social"],
  Science: ["tech", "learning"],
  Space: ["tech", "learning"],
  Productivity: ["tools", "learning"],
  Design: ["tools", "creator"],
  "UI/UX": ["tools", "creator", "github"],
  "India News": ["social", "market"],
  "World News": ["social"],
  "Social Media Trends": ["social", "instagram", "x"],
  "Creator Economy": ["creator", "social"],
  YouTube: ["creator", "social"],
  Instagram: ["instagram", "social"],
  "Twitter/X": ["x", "social"],
  Cryptocurrency: ["market"],
};
