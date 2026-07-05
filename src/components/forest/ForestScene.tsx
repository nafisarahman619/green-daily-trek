import { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tree, Wildflower, Cloud, Pond, GrassTuft, Creature } from "./Tree";
import type { ForestHealth } from "@/lib/transport";
import { timeOfDay } from "@/lib/transport";

interface ForestSceneProps {
  health: ForestHealth;
  unlockedSpecies: string[];
  compact?: boolean;
}

/**
 * The main forest scene — the emotional heart of the app.
 * Grounded, layered, and continuously alive.
 */
export function ForestScene({ health, unlockedSpecies, compact }: ForestSceneProps) {
  const tod = timeOfDay();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Subtle mouse parallax (background only — foreground stays anchored to ground)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      setParallax({ x: nx, y: ny });
    };
    const onLeave = () => setParallax({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const skyGradient = useMemo(() => {
    switch (tod) {
      case "dawn": return "linear-gradient(180deg, var(--sky-dawn-a), var(--sky-dawn-b) 55%, var(--canvas-warm))";
      case "day": return "linear-gradient(180deg, var(--sky-day-a), var(--sky-day-b) 60%, var(--canvas-warm))";
      case "dusk": return "linear-gradient(180deg, var(--sky-dusk-a), var(--sky-dusk-b) 55%, oklch(0.35 0.08 20))";
      case "night": return "linear-gradient(180deg, var(--sky-night-a), var(--sky-night-b) 60%, oklch(0.15 0.06 265))";
    }
  }, [tod]);

  const isDark = tod === "night" || tod === "dusk";
  const treeCount = health.treeCount;

  // Ground plane sits at GROUND_TOP % from bottom. All trees/plants anchor here.
  const GROUND_TOP = 36; // percent (matches ground layer height)

  // Pond geometry (percent, in scene coordinates). Flowers/grass must avoid this rect.
  const POND = { left: 58, right: 92, bottomMin: 4, bottomMax: 14 };

  const inPond = (x: number, base: number) =>
    x >= POND.left - 2 && x <= POND.right + 2 && base >= POND.bottomMin - 1 && base <= POND.bottomMax + 2;

  // Deterministic dense forest — distributes trees evenly across three depth rows.
  // Each row gets a proportional share of `treeCount`, evenly spaced with small jitter
  // so trees never clump or overlap into distorted shapes, even at mature (48 trees).
  const trees = useMemo(() => {
    const rng = mulberry32(1337);
    const total = Math.max(1, treeCount);
    // Row split: ~35% back, ~35% mid, ~30% front
    const backN = Math.round(total * 0.35);
    const midN = Math.round(total * 0.35);
    const frontN = Math.max(0, total - backN - midN);

    const all: { x: number; base: number; s: number; stage: ForestHealth["stage"]; z: number; sway: number }[] = [];

    const spread = (
      count: number,
      xMin: number,
      xMax: number,
      baseFn: () => number,
      scaleFn: () => number,
      stage: ForestHealth["stage"],
      zBase: (base: number) => number,
    ) => {
      if (count <= 0) return;
      const span = xMax - xMin;
      const step = span / count;
      // Max jitter kept below half-step so slots never swap → no overlap
      const jitterAmp = step * 0.35;
      for (let i = 0; i < count; i++) {
        const center = xMin + step * (i + 0.5);
        const x = center + (rng() - 0.5) * 2 * jitterAmp;
        const base = baseFn();
        const s = scaleFn();
        all.push({ x, base, s, stage, z: zBase(base), sway: rng() });
      }
    };

    // Back row (far, smaller, on horizon)
    spread(backN, 2, 98, () => 26 + rng() * 8, () => 0.65 + rng() * 0.22,
      downStage(downStage(health.stage)), (b) => 10 + Math.floor(b));
    // Mid row
    spread(midN, 1, 99, () => 14 + rng() * 12, () => 1.0 + rng() * 0.35,
      downStage(health.stage), (b) => 40 + Math.floor((30 - b) * 2));
    // Front row (large, low) — restrict to left side so pond area stays clear
    spread(frontN, 2, 56, () => 2 + rng() * 10, () => 1.45 + rng() * 0.4,
      health.stage, (b) => 80 + Math.floor((15 - b) * 3));

    // Filter: no trees on pond area
    return all.filter((t) => !inPond(t.x, t.base));
  }, [treeCount, health.stage]);

  // Dense grass tufts — clustered, varied heights & shades, avoiding pond
  const grasses = useMemo(() => {
    const rng = mulberry32(42);
    const arr: { x: number; base: number; scale: number; shade: 0 | 1 | 2; delay: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const x = rng() * 100;
      const base = rng() * 22; // within grass layer
      if (inPond(x, base)) continue;
      arr.push({
        x,
        base,
        scale: 0.6 + rng() * 0.9,
        shade: (Math.floor(rng() * 3) as 0 | 1 | 2),
        delay: rng() * 2,
      });
    }
    return arr;
  }, []);

  // Flowers — clustered on land only, never on pond
  const flowers = useMemo(() => {
    const rng = mulberry32(99);
    const arr: { x: number; base: number; variant: 1 | 2 | 3; delay: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const x = rng() * 100;
      const base = 2 + rng() * 14;
      if (inPond(x, base)) continue;
      arr.push({
        x,
        base,
        variant: (((Math.floor(rng() * 3)) + 1) as 1 | 2 | 3),
        delay: 0.4 + rng() * 0.8,
      });
    }
    return arr;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl surface-card"
      style={{
        background: skyGradient,
        aspectRatio: compact ? "16 / 9" : "16 / 10",
        boxShadow: "var(--shadow-card), var(--shadow-inner-warm)",
        isolation: "isolate",
        contain: "paint",
      }}
    >
      {/* Sun / moon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, x: parallax.x * -14, y: parallax.y * -6 }}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.2 }, x: { type: "spring", stiffness: 40, damping: 15 }, y: { type: "spring", stiffness: 40, damping: 15 } }}
        style={{
          position: "absolute",
          top: tod === "day" ? "12%" : tod === "night" ? "10%" : "18%",
          right: tod === "dusk" ? "18%" : "12%",
          width: 70,
          height: 70,
          borderRadius: "50%",
          background:
            tod === "night"
              ? "radial-gradient(circle at 35% 35%, oklch(0.95 0.02 100), oklch(0.75 0.02 100))"
              : tod === "dusk"
              ? "radial-gradient(circle, oklch(0.88 0.14 45), oklch(0.75 0.16 35))"
              : "radial-gradient(circle, oklch(0.98 0.12 90), oklch(0.85 0.14 75))",
          boxShadow:
            tod === "night"
              ? "0 0 40px oklch(0.9 0.03 100 / 0.5)"
              : "0 0 60px oklch(0.95 0.14 70 / 0.6)",
        }}
      />

      {/* Stars at night */}
      {tod === "night" &&
        Array.from({ length: 25 }).map((_, i) => (
          <span
            key={i}
            className="twinkle"
            style={{
              position: "absolute",
              top: `${(i * 7) % 45}%`,
              left: `${(i * 13) % 100}%`,
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: "white",
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          />
        ))}

      {/* Clouds — parallax background */}
      <motion.div className="absolute inset-x-0 pointer-events-none" style={{ top: "6%" }} animate={{ x: parallax.x * -18 }} transition={{ type: "spring", stiffness: 30, damping: 12 }}>
        <div className="drift-cloud-slow" style={{ opacity: isDark ? 0.4 : 0.9 }}>
          <Cloud scale={0.75} />
        </div>
      </motion.div>
      <motion.div className="absolute inset-x-0 pointer-events-none" style={{ top: "20%" }} animate={{ x: parallax.x * -10 }} transition={{ type: "spring", stiffness: 30, damping: 12 }}>
        <div className="drift-cloud" style={{ opacity: isDark ? 0.35 : 0.75, animationDelay: "-30s" }}>
          <Cloud scale={0.55} opacity={0.7} />
        </div>
      </motion.div>

      {/* Distant hills — slight parallax */}
      <motion.svg
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "44%", height: "38%" }}
        animate={{ x: parallax.x * -4 }}
        transition={{ type: "spring", stiffness: 30, damping: 12 }}
      >
        <path d="M0 200 Q120 120 240 170 T480 160 T800 180 L800 300 L0 300 Z" fill="oklch(0.55 0.09 145)" opacity="0.55" />
        <path d="M0 230 Q160 170 320 200 T640 210 T800 220 L800 300 L0 300 Z" fill="oklch(0.45 0.11 140)" opacity="0.8" />
      </motion.svg>

      {/* ============ GROUND + FOREGROUND (anchored together) ============ */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: `${GROUND_TOP}%` }}>
        {/* Grass base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, var(--grass-a) 0%, var(--grass-b) 35%, var(--grass-deep) 72%, var(--soil) 100%)",
          }}
        />
        {/* Horizon curve */}
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className="absolute inset-x-0 top-0" style={{ height: 32, transform: "translateY(-14px)" }}>
          <path d="M0 40 Q80 10 180 28 T360 22 T540 30 T720 20 T800 26 L800 60 L0 60 Z" fill="var(--grass-a)" />
          <path d="M0 48 Q100 30 220 42 T440 38 T680 44 T800 40 L800 60 L0 60 Z" fill="var(--grass-b)" opacity="0.7" />
        </svg>

        {/* Dense grass blade texture — many small varied strokes across full ground */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
          {Array.from({ length: 260 }).map((_, i) => {
            const seed = i * 2654435761;
            const rx = ((seed >>> 0) % 1000) / 1000;
            const ry = (((seed * 7) >>> 0) % 1000) / 1000;
            const x = rx * 400;
            const y = 8 + ry * 190;
            const h = 3 + ((i * 5) % 8);
            const bend = ((i % 5) - 2) * 1.2;
            const shades = ["var(--grass-a)", "var(--grass-b)", "var(--grass-deep)", "oklch(0.62 0.14 145)"];
            const stroke = shades[i % 4];
            const opacity = 0.55 + ((i % 4) * 0.1);
            return (
              <path
                key={i}
                d={`M${x} ${y + h} Q${x + bend} ${y + h / 2} ${x + bend * 2} ${y}`}
                stroke={stroke}
                strokeWidth={0.9}
                fill="none"
                opacity={opacity}
              />
            );
          })}
        </svg>

        {/* Soil line highlight */}
        <div className="absolute inset-x-0" style={{ bottom: 0, height: 8, background: "linear-gradient(180deg, transparent, oklch(0.28 0.06 55 / 0.35))" }} />

        {/* --- Pond (inside ground layer so it scrolls with land) --- */}
        <div className="absolute" style={{ left: "58%", bottom: "10%", width: "34%", zIndex: 20 }}>
          <Pond />
        </div>

        {/* --- Trees (positioned relative to ground layer, so they never detach) --- */}
        {trees.map((t, i) => {
          // Convert base (percent of scene height) to percent of ground layer height
          const bottomPct = (t.base / GROUND_TOP) * 100;
          const isFar = t.s < 0.9;
          return (
            <div
              key={`tr-${i}`}
              className="absolute"
              style={{
                left: `${t.x}%`,
                bottom: `${bottomPct}%`,
                transform: `translateX(-50%) scale(${t.s})`,
                transformOrigin: "bottom center",
                zIndex: t.z,
                filter: isFar ? `saturate(0.7) brightness(${0.85 + t.sway * 0.05}) blur(0.3px)` : undefined,
                opacity: isFar ? 0.88 : 1,
              }}
            >
              {/* Ground shadow */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -4,
                  width: 80,
                  height: 14,
                  transform: "translateX(-50%)",
                  background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.32), transparent 70%)",
                  filter: "blur(2px)",
                  pointerEvents: "none",
                }}
              />
              {isFar ? (
                <SimpleTree color="var(--fern-deep)" />
              ) : (
                <Tree stage={t.stage} delay={Math.min(i * 0.03, 0.9)} />
              )}
            </div>
          );
        })}

        {/* Flowers — only on land */}
        {flowers.map((f, i) => (
          <div
            key={`f-${i}`}
            className="absolute"
            style={{
              left: `${f.x}%`,
              bottom: `${(f.base / GROUND_TOP) * 100}%`,
              zIndex: 45,
              transform: "translateX(-50%)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                bottom: -3,
                width: 20,
                height: 5,
                transform: "translateX(-50%)",
                background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.25), transparent 70%)",
                filter: "blur(1.5px)",
              }}
            />
            <Wildflower variant={f.variant} delay={f.delay} />
          </div>
        ))}

        {/* Grass tufts — dense, varied */}
        {grasses.map((g, i) => {
          const shades = ["var(--grass-a)", "var(--grass-b)", "var(--grass-deep)"];
          return (
            <div
              key={`g-${i}`}
              className="absolute"
              style={{
                left: `${g.x}%`,
                bottom: `${(g.base / GROUND_TOP) * 100}%`,
                zIndex: 30 + Math.floor(g.base),
                transform: `translateX(-50%) scale(${g.scale})`,
                transformOrigin: "bottom center",
                color: shades[g.shade],
              }}
            >
              <GrassTuft delay={g.delay} />
            </div>
          );
        })}
      </div>

      {/* Wildlife */}
      <AnimatePresence>
        {unlockedSpecies.includes("butterfly") && (
          <motion.div
            key="bfly"
            className="absolute"
            style={{ left: "22%", bottom: "55%", zIndex: 200 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [0, 30, 10, 40, 0], y: [0, -12, 6, -8, 0] }}
            transition={{ opacity: { duration: 0.6 }, x: { duration: 12, repeat: Infinity, ease: "easeInOut" }, y: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
          >
            <Creature id="butterfly" />
          </motion.div>
        )}
        {unlockedSpecies.includes("bird") && (
          <motion.div
            key="bird"
            className="absolute"
            style={{ left: "68%", bottom: "60%", zIndex: 200 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [0, -20, 15, 0], y: [0, -6, -2, 0] }}
            transition={{ opacity: { duration: 0.6 }, x: { duration: 9, repeat: Infinity, ease: "easeInOut" }, y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
          >
            <Creature id="bird" />
          </motion.div>
        )}
        {unlockedSpecies.includes("rabbit") && (
          <motion.div
            key="rab"
            className="absolute"
            style={{ left: "40%", bottom: "8%", zIndex: 190 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, -8, 0, 0, 0, -8, 0] }}
            transition={{ opacity: { duration: 0.6 }, y: { duration: 4.5, repeat: Infinity, ease: "easeOut" } }}
          >
            <div style={{ position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", left: "50%", bottom: -4, width: 46, height: 8, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.3), transparent 70%)", filter: "blur(2px)" }} />
              <Creature id="rabbit" />
            </div>
          </motion.div>
        )}
        {unlockedSpecies.includes("deer") && (
          <motion.div key="deer" className="absolute" style={{ left: "8%", bottom: "10%", zIndex: 190 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", left: "50%", bottom: -4, width: 60, height: 10, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.32), transparent 70%)", filter: "blur(2px)" }} />
              <Creature id="deer" />
            </div>
          </motion.div>
        )}
        {unlockedSpecies.includes("fox") && (
          <motion.div key="fox" className="absolute" style={{ left: "78%", bottom: "6%", zIndex: 190 }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", left: "50%", bottom: -4, width: 56, height: 10, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.32), transparent 70%)", filter: "blur(2px)" }} />
              <Creature id="fox" />
            </div>
          </motion.div>
        )}
        {unlockedSpecies.includes("firefly") &&
          [0, 1, 2, 3].map((i) => (
            <motion.div
              key={`ff-${i}`}
              className="absolute"
              style={{ left: `${30 + i * 15}%`, bottom: `${28 + (i % 2) * 12}%`, zIndex: 200 }}
              animate={{ x: [0, 12, -8, 6, 0], y: [0, -10, -4, -14, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            >
              <Creature id="firefly" />
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Storm overlay */}
      <AnimatePresence>
        {health.isStorm && (
          <motion.div
            key="storm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 210, background: "linear-gradient(180deg, oklch(0.3 0.04 260 / 0.35), oklch(0.2 0.04 260 / 0.15))" }}
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="rain-drop absolute"
                style={{
                  left: `${(i * 13) % 100}%`,
                  top: "-10%",
                  width: 2,
                  height: 12,
                  background: "oklch(0.85 0.05 235 / 0.7)",
                  animationDelay: `${(i % 10) * 0.1}s`,
                  borderRadius: 2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Simplified background tree — lightweight silhouette for depth layers */
function SimpleTree({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 90" style={{ width: 60, height: 90, overflow: "visible" }}>
      <path d="M30 88 Q29 60 28 48" stroke="oklch(0.3 0.04 45)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M30 12 Q12 14 8 32 Q2 44 14 52 Q18 62 32 60 Q48 64 52 50 Q60 42 52 30 Q50 12 30 12 Z" fill={color} opacity="0.85" />
    </svg>
  );
}

function downStage(s: ForestHealth["stage"]): ForestHealth["stage"] {
  return s === "mature" ? "young" : s === "young" ? "sapling" : s === "sapling" ? "seedling" : "seedling";
}

// Small deterministic PRNG so layouts are stable across renders.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
