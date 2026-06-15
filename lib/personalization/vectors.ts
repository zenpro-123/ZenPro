import { INTEREST_CATEGORY_MAP, type Interest } from "@/config/interests";

/**
 * Builds the initial interest vector from a user's onboarding selections.
 * Each selected interest votes for the content categories it maps to
 * (see `INTEREST_CATEGORY_MAP`); votes are normalized to a 0–1 range so the
 * vector can be used directly as a relevance weight per category.
 */
export function buildInterestVector(interests: string[]): Record<string, number> {
  const votes: Record<string, number> = {};

  for (const interest of interests) {
    const categories = INTEREST_CATEGORY_MAP[interest as Interest] ?? [];
    for (const category of categories) {
      votes[category] = (votes[category] ?? 0) + 1;
    }
  }

  const max = Math.max(1, ...Object.values(votes));
  const vector: Record<string, number> = {};
  for (const [category, count] of Object.entries(votes)) {
    vector[category] = Math.round((count / max) * 100) / 100;
  }

  return vector;
}

/**
 * Nudges the interest vector toward a category after a user interaction
 * (view/save). Used by V2's recommendation engine refinement loop.
 */
export function reinforceVector(
  vector: Record<string, number>,
  category: string,
  amount = 0.05
): Record<string, number> {
  const current = vector[category] ?? 0;
  return { ...vector, [category]: Math.min(1, Math.round((current + amount) * 100) / 100) };
}
