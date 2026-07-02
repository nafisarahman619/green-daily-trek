import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useForestData } from "@/hooks/use-forest";
import { DAILY_BASELINE_KG } from "@/lib/transport";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Carbon Footprint Forest" },
      { name: "description", content: "Every day, every trip, every leaf." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading } = useForestData();

  const byDate = new Map<string, { co2: number; modes: string[] }>();
  (data?.logs ?? []).forEach((l) => {
    const cur = byDate.get(l.log_date) ?? { co2: 0, modes: [] };
    cur.co2 += Number(l.co2_kg);
    cur.modes.push(l.mode);
    byDate.set(l.log_date, cur);
  });
  const days = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const max = Math.max(DAILY_BASELINE_KG * 1.5, ...days.map(([, v]) => v.co2), 1);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="display text-3xl md:text-4xl">History</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Days below the {DAILY_BASELINE_KG} kg baseline grow your forest.
        </p>

        {isLoading && <p className="mt-6" style={{ color: "var(--ink-soft)" }}>Reading the rings…</p>}

        {days.length === 0 && !isLoading && (
          <div className="mt-6 surface-card p-8 text-center">
            <p className="display text-xl" style={{ color: "var(--delft-deep)" }}>Nothing here yet.</p>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>Your first log will bloom this page.</p>
          </div>
        )}

        <div className="mt-6 surface-card p-6">
          <div className="flex items-end gap-2 overflow-x-auto pb-3" style={{ height: 200 }}>
            {days.slice().reverse().map(([date, v], i) => {
              const h = Math.max(6, (v.co2 / max) * 160);
              const good = v.co2 <= DAILY_BASELINE_KG;
              return (
                <div key={date} className="flex flex-col items-center gap-1" style={{ minWidth: 26 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: h }}
                    transition={{ delay: i * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                    style={{
                      width: 18,
                      borderRadius: 8,
                      background: good ? "linear-gradient(180deg, var(--pistachio), var(--fern))" : "linear-gradient(180deg, var(--carolina), var(--delft))",
                    }}
                  />
                  <span className="text-[9px]" style={{ color: "var(--ink-soft)" }}>{date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {days.map(([date, v]) => (
            <li key={date} className="surface-card flex items-center justify-between p-4">
              <div>
                <p className="display text-base" style={{ color: "var(--delft-deep)" }}>{date}</p>
                <p className="text-xs" style={{ color: "var(--ink-soft)" }}>{v.modes.join(" · ")}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: v.co2 <= DAILY_BASELINE_KG ? "color-mix(in oklab, var(--pistachio) 50%, var(--paper))" : "color-mix(in oklab, var(--carolina) 40%, var(--paper))",
                  color: "var(--delft-deep)",
                }}
              >
                {v.co2.toFixed(2)} kg CO₂
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
