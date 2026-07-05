import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeHealth, DAILY_BASELINE_KG } from "@/lib/transport";
import { evaluateUnlocks, SPECIES } from "@/lib/wildlife";
import { useEffect, useMemo, useState } from "react";

export interface ForestData {
  logs: { co2_kg: number; log_date: string; mode: string }[];
  totalCO2: number;
  totalLogs: number;
  goodDays: number;
  streak: number;
  unlocks: string[];
  userId: string;
}

export function useForestData() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const query = useQuery({
    queryKey: ["forest", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ForestData> => {
      const [logsRes, unlocksRes] = await Promise.all([
        supabase
          .from("transport_logs")
          .select("co2_kg,log_date,mode,distance_km,created_at")
          .eq("user_id", userId!)
          .order("log_date", { ascending: false })
          .limit(2000),
        supabase.from("wildlife_unlocks").select("species").eq("user_id", userId!),
      ]);
      const logs = (logsRes.data ?? []) as { co2_kg: number; log_date: string; mode: string; distance_km: number; created_at: string }[];
      const unlocked = new Set((unlocksRes.data ?? []).map((r: any) => r.species as string));

      // Aggregate by date
      const byDate = new Map<string, number>();
      logs.forEach((l) => byDate.set(l.log_date, (byDate.get(l.log_date) ?? 0) + Number(l.co2_kg)));
      const dates = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
      const goodDays = dates.filter(([, v]) => v <= DAILY_BASELINE_KG).length;
      let streak = 0;
      for (const [, v] of dates) {
        if (v <= DAILY_BASELINE_KG) streak++;
        else break;
      }
      const totalCO2 = logs.reduce((s, l) => s + Number(l.co2_kg), 0);
      const nightLogSet = new Set<string>();
      const nightLogs = logs.filter((l) => {
        const h = new Date(l.created_at).getHours();
        const isNight = h >= 20 || h < 6;
        if (isNight) nightLogSet.add(l.log_date);
        return isNight;
      }).length;
      const nightDays = nightLogSet.size;

      // Zero-emission days: every trip that day is walk or bike
      const modesByDate = new Map<string, string[]>();
      logs.forEach((l) => {
        const arr = modesByDate.get(l.log_date) ?? [];
        arr.push(l.mode);
        modesByDate.set(l.log_date, arr);
      });
      let zeroEmissionStreak = 0;
      for (const [date] of dates) {
        const modes = modesByDate.get(date) ?? [];
        const allZero = modes.length > 0 && modes.every((m) => m === "walk" || m === "bike");
        if (allZero) zeroEmissionStreak++;
        else break;
      }

      // Total low-emission distance (walk / bike / metro)
      const lowEmissionDistanceKm = logs
        .filter((l) => l.mode === "walk" || l.mode === "bike" || l.mode === "metro")
        .reduce((s, l) => s + Number(l.distance_km ?? 0), 0);

      // Forest-health-90 streak: consecutive most-recent days with score >= 90
      // score = round(55 + (baseline - dayTotal) * 12); >=90 means dayTotal <= ~(baseline - 35/12)
      const health90Threshold = DAILY_BASELINE_KG - 35 / 12;
      let forestHealth90Streak = 0;
      for (const [, v] of dates) {
        if (v <= health90Threshold) forestHealth90Streak++;
        else break;
      }

      const totalTrips = logs.length;

      // Sync unlocks
      const shouldUnlock = evaluateUnlocks({
        totalLogs: dates.length,
        totalTrips,
        goodDays,
        streak,
        nightLogs,
        nightDays,
        zeroEmissionStreak,
        lowEmissionDistanceKm,
        forestHealth90Streak,
      });

      const newlyUnlocked = shouldUnlock.filter((s) => !unlocked.has(s));
      if (newlyUnlocked.length > 0) {
        await supabase
          .from("wildlife_unlocks")
          .insert(newlyUnlocked.map((species) => ({ user_id: userId!, species })));
        newlyUnlocked.forEach((s) => unlocked.add(s));
      }


      return {
        logs,
        totalCO2,
        totalLogs: dates.length,
        goodDays,
        streak,
        unlocks: [...unlocked],
        userId: userId!,
      };
    },
  });

  const health = useMemo(
    () => computeHealth(query.data?.logs ?? []),
    [query.data?.logs],
  );

  return { ...query, data: query.data, health, species: SPECIES };
}
