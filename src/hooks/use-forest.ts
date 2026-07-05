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
          .select("co2_kg,log_date,mode,created_at")
          .eq("user_id", userId!)
          .order("log_date", { ascending: false })
          .limit(200),
        supabase.from("wildlife_unlocks").select("species").eq("user_id", userId!),
      ]);
      const logs = (logsRes.data ?? []) as { co2_kg: number; log_date: string; mode: string; created_at: string }[];
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
      const nightLogs = logs.filter((l) => {
        const h = new Date(l.created_at).getHours();
        return h >= 20 || h < 6;
      }).length;

      // Sync unlocks
      const shouldUnlock = evaluateUnlocks({ totalLogs: dates.length, goodDays, streak, nightLogs });

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
