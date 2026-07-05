import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DAILY_BASELINE_KG } from "@/lib/transport";
import { Tree } from "@/components/forest/Tree";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Carbon Footprint Forest" },
      { name: "description", content: "See whose forest is thriving." },
    ],
  }),
  component: LeaderboardPage,
});

type Row = {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  total_co2: number;
  good_days: number;
  score: number;
};

function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<Row[]> => {
      const [profRes, logRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_emoji").limit(200),
        supabase.from("transport_logs").select("user_id, co2_kg, log_date").limit(5000),
      ]);
      const profiles = profRes.data ?? [];
      const logs = logRes.data ?? [];
      const byUser = new Map<string, { total: number; days: Set<string>; good: Set<string> }>();
      for (const l of logs as any[]) {
        const b = byUser.get(l.user_id) ?? { total: 0, days: new Set(), good: new Set() };
        b.total += Number(l.co2_kg);
        b.days.add(l.log_date);
        byUser.set(l.user_id, b);
      }
      // count good days = days where sum <= baseline
      const dayTotals = new Map<string, Map<string, number>>();
      for (const l of logs as any[]) {
        const inner = dayTotals.get(l.user_id) ?? new Map<string, number>();
        inner.set(l.log_date, (inner.get(l.log_date) ?? 0) + Number(l.co2_kg));
        dayTotals.set(l.user_id, inner);
      }
      return profiles
        .map((p: any) => {
          const inner = dayTotals.get(p.id) ?? new Map();
          const daysArr = [...inner.entries()];
          const good = daysArr.filter(([, v]) => (v as number) <= DAILY_BASELINE_KG).length;
          const total = daysArr.reduce((s, [, v]) => s + (v as number), 0);
          const avg = daysArr.length ? total / daysArr.length : DAILY_BASELINE_KG;
          const score = Math.max(0, Math.min(100, Math.round(55 + (DAILY_BASELINE_KG - avg) * 12)));
          return {
            user_id: p.id,
            display_name: p.display_name ?? "Forest friend",
            avatar_emoji: p.avatar_emoji ?? "🌱",
            total_co2: total,
            good_days: good,
            score,
          };
        })
        .filter((r) => (dayTotals.get(r.user_id)?.size ?? 0) > 0)
        .sort((a, b) => b.good_days - a.good_days || a.total_co2 - b.total_co2)
        .slice(0, 25);
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="display text-3xl md:text-4xl">Forest leaderboard</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
              Ranked by total days logged under {DAILY_BASELINE_KG} kg CO₂.
            </p>
          </div>
          <span className="chip-soft"><Trophy className="h-3.5 w-3.5" /> Top {data?.length ?? 0}</span>
        </div>

        {isLoading && <p style={{ color: "var(--ink-soft)" }}>Gathering the grove…</p>}

        {data && data.length === 0 && (
          <div className="surface-card p-8 text-center">
            <p className="display text-xl" style={{ color: "var(--delft-deep)" }}>Be the first sapling.</p>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>Log a day to appear on the leaderboard.</p>
          </div>
        )}

        <ul className="space-y-3">
          {data?.map((r, i) => {
            const stage =
              r.score >= 82 ? "mature" :
              r.score >= 60 ? "young" :
              r.score >= 35 ? "sapling" : "seedling";
            const podium = i < 3;
            return (
              <motion.li
                key={r.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="surface-card flex items-center gap-4 p-4"
                style={podium ? { background: "linear-gradient(140deg, color-mix(in oklab, var(--pistachio) 35%, var(--paper)), var(--paper))" } : undefined}
              >
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold"
                  style={{
                    background: podium ? "var(--fern)" : "var(--canvas-warm)",
                    color: podium ? "var(--paper)" : "var(--delft-deep)",
                  }}
                >
                  {i + 1}
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: "var(--canvas)" }}>
                  <div style={{ transform: "scale(0.55)" }}>
                    <Tree stage={stage as any} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate display text-lg" style={{ color: "var(--delft-deep)" }}>
                    <span className="mr-1">{r.avatar_emoji}</span> {r.display_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {r.good_days} low-emission day{r.good_days === 1 ? "" : "s"} · {r.total_co2.toFixed(1)} kg tracked
                  </p>
                </div>
                <div className="text-right">
                  <p className="display text-2xl" style={{ color: "var(--fern-shade)" }}>{r.good_days}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>good days</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
