import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ForestScene } from "@/components/forest/ForestScene";
import { RootNetwork } from "@/components/forest/RootNetwork";
import { LoadingSeedling } from "@/components/LoadingSeedling";
import { useForestData } from "@/hooks/use-forest";
import { useLifetimeSaved } from "@/hooks/use-lifetime-saved";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Sprout, TrendingDown, TreePine, Cloud, Waypoints } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SPECIES } from "@/lib/wildlife";
import { timeOfDay, DAILY_BASELINE_KG } from "@/lib/transport";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Your Forest — Carbon Footprint Forest" },
      { name: "description", content: "Your living forest, powered by how you moved today." },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  const { data, health, isLoading } = useForestData();
  const { data: lifetime } = useLifetimeSaved();
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [showRoots, setShowRoots] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", user.user.id).maybeSingle();
      setProfile(p as any);
    })();
  }, []);

  if (isLoading || !data) return <LoadingSeedling label="Waking your forest…" />;

  const lifetimeSaved = lifetime?.lifetimeCO2Saved ?? 0;

  const tod = timeOfDay();
  const greeting =
    tod === "dawn" ? "Good morning" :
    tod === "day" ? "Hello" :
    tod === "dusk" ? "Good evening" : "Good night";

  const status =
    health.score >= 80 ? { label: "Flourishing", tone: "chip-soft" as const, icon: <Sparkles className="h-3.5 w-3.5" /> } :
    health.score >= 55 ? { label: "Growing steadily", tone: "chip-soft" as const, icon: <Sprout className="h-3.5 w-3.5" /> } :
    health.isStorm ? { label: "Weathering a storm", tone: "chip-blue" as const, icon: <Cloud className="h-3.5 w-3.5" /> } :
    { label: "Ready to grow", tone: "chip-blue" as const, icon: <TreePine className="h-3.5 w-3.5" /> };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>{greeting}, {profile?.display_name ?? "friend"}</p>
          <h1 className="display text-3xl md:text-4xl">Your forest today</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={status.tone}>{status.icon}{status.label}</span>
          <span className="chip-blue">Streak · {data.streak}d</span>
          <Link to="/log" className="btn-fern" style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>
            <Sprout className="h-4 w-4" /> Log today
          </Link>
        </div>
      </div>

      {/* Main scene */}
      <ForestScene health={health} unlockedSpecies={data.unlocks} />

      {/* Root network — independent, additive underground layer */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>
            Root network
          </p>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Lifetime CO₂ saved · {lifetimeSaved.toFixed(1)} kg vs solo car
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRoots((v) => !v)}
          className="chip-soft"
          aria-pressed={showRoots}
          style={{ cursor: "pointer" }}
        >
          <Waypoints className="h-3.5 w-3.5" />
          {showRoots ? "Hide roots" : "View roots"}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {showRoots && (
          <motion.div
            key="roots"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-3 overflow-hidden"
          >
            <RootNetwork lifetimeCO2Saved={lifetimeSaved} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics */}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Forest health" value={`${health.score}`} suffix="/100" tone="fern" hint={health.stage} />
        <Metric label="CO₂ tracked" value={data.totalCO2.toFixed(1)} suffix=" kg" tone="delft" hint={`across ${data.totalLogs} days`} />
        <Metric label="Low-emission days" value={String(data.goodDays)} tone="pistachio" hint={`≤ ${DAILY_BASELINE_KG} kg/day`} />
        <Metric label="Trees standing" value={String(health.treeCount)} tone="fern" hint={health.isStorm ? "Storm rolling through" : "Fair skies"} icon={<TreePine className="h-4 w-4" />} />
      </div>

      {/* Wildlife journal */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="surface-card p-6">
          <h3 className="display text-xl">Ecosystem</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            Long-term milestones. Once earned, they stay — even on rough days.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {SPECIES.map((s) => {
              const unlocked = data.unlocks.includes(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{
                    background: unlocked ? "color-mix(in oklab, var(--pistachio) 25%, var(--paper))" : "var(--paper)",
                    borderColor: "var(--border)",
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl text-lg" style={{ background: "var(--canvas-warm)" }}>
                    {s.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: "var(--delft-deep)" }}>{s.name}</p>
                    <p className="truncate text-[11px]" style={{ color: "var(--ink-soft)" }}>{unlocked ? "Now living here" : s.requirement}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface-card p-6">
          <h3 className="display text-xl">Today's forest note</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>A small journal entry — warm, never preachy.</p>
          <div className="mt-4 rounded-2xl p-5" style={{ background: "linear-gradient(160deg, var(--canvas-warm), var(--paper))", border: "1px solid var(--border)" }}>
            <p className="display text-lg leading-snug" style={{ color: "var(--delft-deep)" }}>
              {journalNote(health, data)}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--ink-soft)" }}>
            <TrendingDown className="h-4 w-4" />
            You have logged {data.totalLogs} day{data.totalLogs === 1 ? "" : "s"}.
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value, suffix, tone, hint, icon }: any) {
  const bg =
    tone === "fern" ? "linear-gradient(160deg, color-mix(in oklab, var(--pistachio) 30%, var(--paper)), var(--paper))" :
    tone === "delft" ? "linear-gradient(160deg, color-mix(in oklab, var(--sky) 25%, var(--paper)), var(--paper))" :
    "linear-gradient(160deg, color-mix(in oklab, var(--pistachio) 40%, var(--paper)), var(--paper))";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card p-5"
      style={{ background: bg }}
    >
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>{label}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="display text-3xl" style={{ color: "var(--fern-shade)" }}>{value}</span>
        {suffix && <span className="text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>{suffix}</span>}
        {icon}
      </p>
      {hint && <p className="mt-1 text-xs capitalize" style={{ color: "var(--ink-soft)" }}>{hint}</p>}
    </motion.div>
  );
}

function journalNote(h: ReturnType<typeof import("@/lib/transport").computeHealth>, d: any): string {
  if (d.totalLogs === 0) return "A quiet clearing, waiting for its first footprint. Log a day to plant your first sapling.";
  if (h.isStorm) return "A short storm is passing overhead. The roots hold — a few walked or shared trips will clear the skies.";
  if (h.streakGoodDays >= 7) return `Seven bright days in a row. Your canopy has never been this alive.`;
  if (h.score >= 80) return "Fern fronds unfurling, wildflowers open — a low-carbon week has left the forest humming.";
  if (h.score >= 55) return "Steady breathing today. Small choices — a bus, a bike, a walk — kept the saplings green.";
  return "The trees are pacing themselves. A lighter trip tomorrow will bring the colour back.";
}
