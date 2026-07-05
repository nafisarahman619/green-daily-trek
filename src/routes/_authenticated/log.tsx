import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MODES, TransportMode, calcCO2Kg } from "@/lib/transport";
const co2ForTrip = (mode: TransportMode, km: number) => calcCO2Kg(mode, km, 1);
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({
    meta: [
      { title: "Log today — Carbon Footprint Forest" },
      { name: "description", content: "Add today's trips. Watch your forest respond." },
    ],
  }),
  component: LogPage,
});

type Trip = { mode: TransportMode; km: number };

function LogPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [trips, setTrips] = useState<Trip[]>([{ mode: "walk", km: 2 }]);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState<null | "good" | "storm" | "neutral">(null);
  // CO2 already saved to the DB for the selected date (all prior submissions).
  const [savedDayCO2, setSavedDayCO2] = useState(0);

  // Load the day's already-saved CO2 total so Day Total reflects EVERY trip
  // logged that calendar day, not just the current form batch.
  const loadSavedDayCO2 = async (d: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;
    const { data } = await supabase
      .from("transport_logs")
      .select("co2_kg")
      .eq("user_id", user.user.id)
      .eq("log_date", d);
    const total = (data ?? []).reduce((s, r: any) => s + Number(r.co2_kg), 0);
    return total;
  };

  // Always start with a fresh empty entry. Existing rows for the date remain
  // in the DB — the form APPENDS more trips to them.
  useEffect(() => {
    let cancelled = false;
    setTrips([{ mode: "walk", km: 2 }]);
    loadSavedDayCO2(date).then((t) => {
      if (!cancelled) setSavedDayCO2(t);
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const formCO2 = trips.reduce((s, t) => s + co2ForTrip(t.mode, t.km), 0);
  const totalCO2 = savedDayCO2 + formCO2;

  const setTrip = (i: number, patch: Partial<Trip>) =>
    setTrips((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const submit = async () => {
    setBusy(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not signed in");

      // Append new trips for the day — do NOT delete existing rows.
      // This preserves earlier logs so the day's CO2 is the sum of all trips.
      const rows = trips.map((t) => ({
        user_id: user.user!.id,
        log_date: date,
        mode: t.mode,
        distance_km: Number(t.km.toFixed(2)),
        trips: 1,
        co2_kg: Number(co2ForTrip(t.mode, t.km).toFixed(3)),
      }));
      const { error } = await supabase.from("transport_logs").insert(rows);
      if (error) throw error;

      const tone = totalCO2 <= 2 ? "good" : totalCO2 >= 6 ? "storm" : "neutral";
      setCelebrate(tone);
      setTimeout(() => navigate({ to: "/app" }), 2200);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
      setBusy(false);
    }

  };



  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="display text-3xl md:text-4xl">Log a day</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Add each way you moved. We tally CO₂ from a public per-mode lookup — no black box.
        </p>

        <div className="mt-6 surface-card p-6">
          <label className="mb-4 block">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>Date</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ background: "var(--paper)", borderColor: "var(--border)", color: "var(--ink)" }}
            />
          </label>

          <div className="space-y-3">
            {trips.map((t, i) => {
              const mode = MODES.find((m) => m.id === t.mode)!;
              const co2 = co2ForTrip(t.mode, t.km);
              return (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-3xl border p-4"
                  style={{ background: "var(--paper)", borderColor: "var(--border)" }}
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {MODES.slice(0, 9).map((m) => {
                      const active = m.id === t.mode;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setTrip(i, { mode: m.id })}
                          className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors"
                          style={{
                            background: active
                              ? "color-mix(in oklab, var(--pistachio) 55%, var(--paper))"
                              : "var(--canvas)",
                            borderColor: active ? "var(--fern)" : "var(--border)",
                            color: "var(--delft-deep)",
                          }}
                        >
                          <span>{m.emoji}</span>
                          <span className="truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <label className="flex-1">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>
                        Distance · {t.km.toFixed(1)} km
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        step={0.5}
                        value={t.km}
                        onChange={(e) => setTrip(i, { km: Number(e.target.value) })}
                        className="mt-2 w-full accent-[color:var(--fern)]"
                      />
                    </label>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>Est. CO₂</p>
                      <p className="display text-lg" style={{ color: "var(--fern-shade)" }}>{co2.toFixed(2)} kg</p>
                    </div>
                    {trips.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTrips((p) => p.filter((_, idx) => idx !== i))}
                        className="text-xs font-semibold underline"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        remove
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px]" style={{ color: "var(--ink-soft)" }}>
                    {mode.emoji} {mode.label} · {(mode.gPerKm / 1000).toFixed(3)} kg CO₂ / km · {mode.blurb}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setTrips((p) => [...p, { mode: "bus", km: 5 }])}
            className="mt-3 w-full rounded-2xl border-2 border-dashed py-3 text-sm font-bold"
            style={{ borderColor: "var(--border)", color: "var(--delft-deep)" }}
          >
            + Add another trip
          </button>

          <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>Day total {savedDayCO2 > 0 ? `(${savedDayCO2.toFixed(2)} already logged + ${formCO2.toFixed(2)} new)` : ""}</p>
              <p className="display text-3xl" style={{ color: "var(--delft-deep)" }}>{totalCO2.toFixed(2)} <span className="text-base">kg CO₂</span></p>
            </div>
            <button disabled={busy} onClick={submit} className="btn-fern">
              {busy ? "Saving…" : "Save & grow"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>{celebrate && <CelebrationOverlay tone={celebrate} co2={totalCO2} />}</AnimatePresence>
    </AppShell>
  );
}

function CelebrationOverlay({ tone, co2 }: { tone: "good" | "storm" | "neutral"; co2: number }) {
  const title = tone === "good" ? "Beautifully light day" : tone === "storm" ? "A little storm passes" : "Steady day, logged";
  const sub =
    tone === "good" ? `${co2.toFixed(2)} kg CO₂ — leaves are sparkling.` :
    tone === "storm" ? `${co2.toFixed(2)} kg CO₂ — the forest bends, roots hold.` :
    `${co2.toFixed(2)} kg CO₂ — the canopy holds its shape.`;
  const color = tone === "good" ? "var(--fern)" : tone === "storm" ? "var(--delft)" : "var(--carolina)";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: "color-mix(in oklab, var(--delft-deep) 40%, transparent)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="surface-card mx-4 max-w-sm p-8 text-center"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${color} 25%, var(--paper))` }}>
          <Sparkles className="h-7 w-7" style={{ color }} />
        </div>
        <h3 className="display mt-4 text-2xl" style={{ color: "var(--delft-deep)" }}>{title}</h3>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>{sub}</p>
        {/* Falling leaves for good day */}
        {tone === "good" && Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="leaf-fall pointer-events-none absolute" style={{
            top: 0, left: `${(i * 37) % 100}%`,
            width: 10, height: 6,
            background: i % 2 ? "var(--pistachio)" : "var(--fern-glow)",
            borderRadius: "50% 10% 50% 10%",
            animationDelay: `${(i % 6) * 0.15}s`,
            // @ts-ignore
            "--fx": `${(i % 2 ? -1 : 1) * (30 + i * 8)}px`,
          }} />
        ))}
      </motion.div>
    </motion.div>
  );
}
