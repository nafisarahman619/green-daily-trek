export type ForestTier = "withering" | "recovering" | "thriving" | "flourishing";

export function tierFromScore(score: number): ForestTier {
  if (score < 25) return "withering";
  if (score < 50) return "recovering";
  if (score < 75) return "thriving";
  return "flourishing";
}

export function tierLabel(t: ForestTier): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
