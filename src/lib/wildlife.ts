// Wildlife species — permanent unlocks based on cumulative good days / streaks.
// Rewards, never punishments. Once unlocked, they stay.

export interface Species {
  id: string;
  name: string;
  emoji: string;
  requirement: string;
  test: (ctx: { totalLogs: number; goodDays: number; streak: number }) => boolean;
}

export const SPECIES: Species[] = [
  {
    id: "butterfly",
    name: "Painted Butterfly",
    emoji: "🦋",
    requirement: "Log your first 3 days",
    test: (c) => c.totalLogs >= 3,
  },
  {
    id: "rabbit",
    name: "Meadow Rabbit",
    emoji: "🐇",
    requirement: "5 low-emission days",
    test: (c) => c.goodDays >= 5,
  },
  {
    id: "bird",
    name: "Songbird",
    emoji: "🐦",
    requirement: "A 3-day green streak",
    test: (c) => c.streak >= 3,
  },
  {
    id: "firefly",
    name: "Firefly Cloud",
    emoji: "✨",
    requirement: "10 low-emission days total",
    test: (c) => c.goodDays >= 10,
  },
  {
    id: "deer",
    name: "Forest Deer",
    emoji: "🦌",
    requirement: "A 7-day green streak",
    test: (c) => c.streak >= 7,
  },
  {
    id: "fox",
    name: "Twilight Fox",
    emoji: "🦊",
    requirement: "20 low-emission days total",
    test: (c) => c.goodDays >= 20,
  },
];

export function evaluateUnlocks(ctx: { totalLogs: number; goodDays: number; streak: number }): string[] {
  return SPECIES.filter((s) => s.test(ctx)).map((s) => s.id);
}
