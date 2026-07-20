import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Tree } from "@/components/forest/Tree";
import { ForestScene } from "@/components/forest/ForestScene";
import { Leaf, Sparkles, TreePine } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "CO2 Tracker — grow a forest with every trip" },
      { name: "description", content: "Log daily transport. Watch a hand-drawn forest live and breathe with your carbon footprint." },
      { property: "og:title", content: "CO2 Tracker" },
      { property: "og:description", content: "Turn everyday transport into a living forest." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--canvas)" }}>
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-2xl"
            style={{ background: "linear-gradient(180deg, var(--fern-glow), var(--fern))", boxShadow: "var(--shadow-leaf)" }}
          >
            <Leaf className="h-5 w-5" style={{ color: "white" }} />
          </div>
          <span className="display text-lg" style={{ color: "var(--delft-deep)" }}>CO2 Tracker</span>
        </div>
        <Link to="/auth" className="btn-fern" style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem" }}>
          Enter forest
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:grid-cols-[1.05fr_1fr] md:py-14">
        <div className="flex flex-col justify-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="chip-soft w-fit"
          >
            <Sparkles className="h-3.5 w-3.5" /> A living carbon tracker
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="display mt-4 text-4xl leading-[1.05] md:text-6xl"
            style={{ color: "var(--delft-deep)" }}
          >
            Every trip you take <span style={{ color: "var(--fern)" }}>grows a forest</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 max-w-xl text-lg"
            style={{ color: "var(--ink-soft)" }}
          >
            Log how you moved today — walk, bike, bus, car. Watch a hand-drawn ecosystem breathe with your carbon footprint. Rabbits arrive. Fireflies drift at dusk. A storm passes when you drive too much, and clears when you don't.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/auth" className="btn-fern"><TreePine className="h-4 w-4" /> Plant your first seed</Link>
            <a href="#how" className="btn-ghost-delft">How it works</a>
          </motion.div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs" style={{ color: "var(--ink-soft)" }}>
            <span>🌱 4kg/day baseline</span>
            <span>🦋 12 unlockable species</span>
            <span>🌦️ Storm-and-recover, never guilt</span>
          </div>
        </div>

        {/* Hero forest */}
        <div className="relative">
          <div className="surface-card overflow-hidden p-3">
            <ForestScene
              health={{ score: 88, stage: "mature", treeCount: 7, isStorm: false, streakGoodDays: 6 }}
              unlockedSpecies={["butterfly", "rabbit", "bird", "firefly"]}
            />
          </div>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-4 -top-4 hidden md:block"
          >
            <div className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ background: "var(--paper)", color: "var(--fern-shade)", boxShadow: "var(--shadow-soft)" }}>
              +2 saplings today
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="display text-3xl md:text-4xl" style={{ color: "var(--delft-deep)" }}>Three steps, no jargon.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Log your trips", d: "Pick how you moved and roughly how far. Zero setup." },
            { n: "02", t: "See the CO₂ math", d: "A transparent per-mode lookup — no black-box AI." },
            { n: "03", t: "Watch it grow", d: "Consistent low-emission days unlock wildlife and a mature canopy." },
          ].map((s) => (
            <div key={s.n} className="surface-card p-6">
              <p className="display text-2xl" style={{ color: "var(--fern)" }}>{s.n}</p>
              <p className="display mt-2 text-xl" style={{ color: "var(--delft-deep)" }}>{s.t}</p>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stages showcase */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="display text-3xl md:text-4xl" style={{ color: "var(--delft-deep)" }}>Four stages of growth.</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>Every tree is hand-designed — same line weight, same little world.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(["seedling", "sapling", "young", "mature"] as const).map((stage) => (
            <div key={stage} className="surface-card flex flex-col items-center gap-3 p-4">
              <Tree stage={stage} />
              <span className="chip-soft capitalize">{stage}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs" style={{ color: "var(--ink-soft)" }}>
        Built with care · A gentle, encouraging way to notice how you move.
      </footer>
    </div>
  );
}
