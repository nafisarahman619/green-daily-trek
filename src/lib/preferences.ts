// Client-side preferences persisted in localStorage.
import { useEffect, useState } from "react";

const THEME_KEY = "cff.theme";
const SOUND_KEY = "cff.sound";

export type Theme = "light" | "dark";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return { theme, setTheme };
}

export function getInitialSound(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(SOUND_KEY);
  if (v === null) return true; // default ON
  return v === "1";
}

export function useSoundPref() {
  const [enabled, setEnabled] = useState<boolean>(() => getInitialSound());
  useEffect(() => {
    localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent("cff:sound", { detail: enabled }));
  }, [enabled]);
  return { enabled, setEnabled };
}

// Daily motivational lines — deterministic by local date.
const MOTIVATIONS = [
  "Keep growing, {name} — every trip counts.",
  "Small steps, tall trees, {name}. Today's a good day to walk one.",
  "The canopy remembers your quiet days, {name}.",
  "One low-carbon choice today, {name}, and the forest breathes deeper.",
  "Steady wins the season, {name}. Your saplings are watching.",
  "A softer footprint today, {name} — the birds will notice.",
  "Roots grow patient, {name}. So do you.",
  "Green skies ahead, {name}. Log a light trip and see.",
  "The pond is still, {name}. Add a ripple of good today.",
  "Today's little walk is tomorrow's tall oak, {name}.",
  "Breathe in, {name} — your forest is rooting for you.",
  "Every kilometre saved is a leaf unfurled, {name}.",
  "Quiet mornings, greener afternoons, {name}.",
  "The wind carries your good habits far, {name}.",
];

export function dailyMotivation(name: string): string {
  const now = new Date();
  const key = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const line = MOTIVATIONS[key % MOTIVATIONS.length];
  return line.replace("{name}", name || "friend");
}
