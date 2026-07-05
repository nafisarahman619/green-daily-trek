// Wildlife species — permanent unlocks based on cumulative good days / streaks.
// Rewards, never punishments. Once unlocked, they stay.

export interface UnlockCtx {
  totalLogs: number;              // distinct days logged
  totalTrips: number;             // total trip rows
  goodDays: number;               // days with dayTotal <= baseline
  streak: number;                 // consecutive most-recent low-emission days
  nightLogs: number;
  nightDays: number;
  zeroEmissionStreak: number;     // consecutive days with only walk/bike
  lowEmissionDistanceKm: number;  // total km on walk/bike/metro
  forestHealth90Streak: number;   // consecutive days with forest health >= 90
}

export interface Species {
  id: string;
  name: string;
  emoji: string;
  requirement: string;
  test: (ctx: UnlockCtx) => boolean;
}

export const SPECIES: Species[] = [
  {
    id: "butterfly",
    name: "Painted Butterfly",
    emoji: "🦋",
    requirement: "Log 14 different days",
    test: (c) => c.totalLogs >= 14,
  },
  {
    id: "rabbit",
    name: "Meadow Rabbit",
    emoji: "🐇",
    requirement: "25 low-emission days",
    test: (c) => c.goodDays >= 25,
  },
  {
    id: "bird",
    name: "Songbird",
    emoji: "🐦",
    requirement: "A 14-day green streak",
    test: (c) => c.streak >= 14,
  },
  {
    id: "firefly",
    name: "Firefly Cloud",
    emoji: "✨",
    requirement: "Appears every night automatically",
    test: () => true,
  },

  {
    id: "deer",
    name: "Forest Deer",
    emoji: "🦌",
    requirement: "A 30-day green streak",
    test: (c) => c.streak >= 30,
  },
  {
    id: "fox",
    name: "Twilight Fox",
    emoji: "🦊",
    requirement: "60 low-emission days total",
    test: (c) => c.goodDays >= 60,
  },
  {
    id: "nightOwl",
    name: "Night Owl",
    emoji: "🦉",
    requirement: "Log night trips (8pm–6am) on 21 different days",
    test: (c) => c.nightDays >= 21,
  },

  // ----- Long-term challenges -----
  {
    id: "carbonGuardian",
    name: "Guardian Tortoise",
    emoji: "🐢",
    requirement: "Maintain a 30-day low-emission streak",
    test: (c) => c.streak >= 30,
  },
  {
    id: "centuryLogger",
    name: "Golden Stag",
    emoji: "🦌",
    requirement: "Log 100 total trips",
    test: (c) => c.totalTrips >= 100,
  },
  {
    id: "zeroEmissionWeek",
    name: "Crystal Dragonfly",
    emoji: "🪰",
    requirement: "7 consecutive days using only walk or bike",
    test: (c) => c.zeroEmissionStreak >= 7,
  },
  {
    id: "marathonCommuter",
    name: "Wandering Crane",
    emoji: "🕊️",
    requirement: "Cover 500 km on walk, bike, or metro",
    test: (c) => c.lowEmissionDistanceKm >= 500,
  },
  {
    id: "forestGuardian",
    name: "Ancient Oak Spirit",
    emoji: "🌳",
    requirement: "Keep Forest Health at 90+ for 14 consecutive days",
    test: (c) => c.forestHealth90Streak >= 14,
  },
];


export function evaluateUnlocks(ctx: UnlockCtx): string[] {
  return SPECIES.filter((s) => s.test(ctx)).map((s) => s.id);
}
