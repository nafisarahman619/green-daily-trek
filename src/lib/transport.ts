// Transport mode definitions, CO2 lookup, and health thresholds.
// Values are grams CO2/km — sourced from typical urban averages.
// The calc is transparent: co2_kg = distance_km * trips * (g/km) / 1000

export type TransportMode =
  | "walk"
  | "bike"
  | "rickshaw"
  | "metro"
  | "bus"
  | "carpool"
  | "motorbike"
  | "car"
  | "plane";

export interface ModeInfo {
  id: TransportMode;
  label: string;
  emoji: string;
  gPerKm: number;       // grams CO2 per km
  tone: "green" | "amber" | "red";
  blurb: string;
}

export const MODES: ModeInfo[] = [
  { id: "walk",      label: "Walked",      emoji: "🚶", gPerKm: 0,   tone: "green", blurb: "Zero emissions, pure canopy fuel." },
  { id: "bike",      label: "Cycled",      emoji: "🚲", gPerKm: 0,   tone: "green", blurb: "Wheels turning, roots deepening." },
  { id: "rickshaw",  label: "Rickshaw",    emoji: "🛺", gPerKm: 60,  tone: "amber", blurb: "A gentle breeze through the leaves." },
  { id: "metro",     label: "Metro / Train", emoji: "🚇", gPerKm: 41, tone: "green", blurb: "Shared rails, shared skies." },
  { id: "bus",       label: "Bus",         emoji: "🚌", gPerKm: 89,  tone: "amber", blurb: "Many together, less per person." },
  { id: "carpool",   label: "Carpool",     emoji: "🚗", gPerKm: 96,  tone: "amber", blurb: "Splitting the ride, splitting the cost." },
  { id: "motorbike", label: "Motorbike",   emoji: "🏍️", gPerKm: 103, tone: "amber", blurb: "Nimble but still burning fuel." },
  { id: "car",       label: "Car (solo)",  emoji: "🚙", gPerKm: 192, tone: "red",   blurb: "Heavy sky, heavier trees." },
  { id: "plane",     label: "Flight",      emoji: "✈️", gPerKm: 255, tone: "red",   blurb: "A storm rolls across the forest." },
];

export const modeById = (id: string): ModeInfo | undefined =>
  MODES.find((m) => m.id === id);

export function calcCO2Kg(mode: TransportMode, distanceKm: number, trips = 1): number {
  const info = modeById(mode);
  if (!info) return 0;
  const g = info.gPerKm * distanceKm * trips;
  return Math.round((g / 1000) * 1000) / 1000; // kg with 3 decimals
}

// Forest health model
// Baseline: 4 kg CO2/day is a rough "average commuter" number.
// Health score ranges 0..100; higher = greener forest.
export const DAILY_BASELINE_KG = 4;

export interface ForestHealth {
  score: number;           // 0..100
  stage: "seedling" | "sapling" | "young" | "mature";
  treeCount: number;       // 2..48
  isStorm: boolean;        // recent bad-day pattern
  streakGoodDays: number;
}

export function computeHealth(recent: { co2_kg: number; log_date: string }[]): ForestHealth {
  // Today-only: forest resets each new day and reflects only today's trips.
  const today = new Date().toISOString().slice(0, 10);
  const todays = recent.filter((r) => r.log_date === today);

  if (todays.length === 0) {
    // No trips logged today: fully healthy default.
    return { score: 100, stage: "mature", treeCount: 48, isStorm: false, streakGoodDays: 0 };
  }

  // Sum ALL of today's trips (day total emissions), not average per trip.
  const dayTotal = todays.reduce((s, r) => s + Number(r.co2_kg), 0);
  // Health scales inversely with CO2: 0 kg -> 100, MAX_KG -> 0. Clamped 0..100.
  const MAX_KG = 20;
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - dayTotal / MAX_KG))));


  const stage =
    score >= 82 ? "mature" :
    score >= 60 ? "young" :
    score >= 35 ? "sapling" : "seedling";

  const treeCount =
    score >= 82 ? 48 :
    score >= 65 ? 34 :
    score >= 45 ? 22 :
    score >= 25 ? 12 : 6;

  const isStorm = false;
  const streakGoodDays = dayTotal <= DAILY_BASELINE_KG ? 1 : 0;

  return { score, stage, treeCount, isStorm, streakGoodDays };
}

export function timeOfDay(): "dawn" | "day" | "dusk" | "night" {
  const h = new Date().getHours();
  if (h < 6) return "night";
  if (h < 9) return "dawn";
  if (h < 17) return "day";
  if (h < 20) return "dusk";
  return "night";
}
