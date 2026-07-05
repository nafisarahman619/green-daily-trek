import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MODES } from "@/lib/transport";

// Lifetime CO2 saved vs a solo-car baseline.
// For each trip: max(0, (car_gPerKm - mode_gPerKm)) * distance_km * trips / 1000  (kg)
// Purely cumulative — never decreases.
const CAR_G_PER_KM = MODES.find((m) => m.id === "car")!.gPerKm;

export function useLifetimeSaved() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  return useQuery({
    queryKey: ["lifetime-saved", userId],
    enabled: !!userId,
    queryFn: async (): Promise<{ lifetimeCO2Saved: number; tripCount: number }> => {
      const { data, error } = await supabase
        .from("transport_logs")
        .select("mode,distance_km,trips")
        .eq("user_id", userId!);
      if (error) throw error;
      const rows = (data ?? []) as { mode: string; distance_km: number; trips: number }[];
      let saved = 0;
      for (const r of rows) {
        const info = MODES.find((m) => m.id === r.mode);
        if (!info) continue;
        const diff = Math.max(0, CAR_G_PER_KM - info.gPerKm);
        saved += (diff * Number(r.distance_km) * Number(r.trips)) / 1000;
      }
      return { lifetimeCO2Saved: saved, tripCount: rows.length };
    },
  });
}

// Milestones drive the density of the root network (0..5).
export function rootDensityLevel(kg: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (kg >= 500) return 5;
  if (kg >= 200) return 4;
  if (kg >= 75) return 3;
  if (kg >= 25) return 2;
  if (kg >= 5) return 1;
  return 0;
}
