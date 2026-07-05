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
  const [containerW, setContainerW] = useState(1000);

  // Track container width so we can scale down tree pixel sizes on narrow screens.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = containerW < 500;
  // Scale trees down proportionally on narrow screens (keeps shape, tightens footprint).
  const mobileTreeScale = isMobile ? Math.max(0.5, containerW / 640) : 1;

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

  // On mobile, trees render larger relative to the pond, so widen the exclusion buffer.
  const pondBuf = isMobile ? 6 : 2;
  const inPond = (x: number, base: number) =>
    x >= POND.left - pondBuf && x <= POND.right + pondBuf && base >= POND.bottomMin - 1 && base <= POND.bottomMax + pondBuf;


  // Deterministic dense forest — up to ~50 trees, back rows smaller (depth).
  // Each tree gets its own x, base (from ground), scale, and stage bias.
  const trees = useMemo(() => {
    const rng = mulberry32(1337);
    const all: { x: number; base: number; s: number; stage: ForestHealth["stage"]; z: number; sway: number }[] = [];
    // Back row (far, smaller, high on horizon)
    for (let i = 0; i < 18; i++) {
      const x = 2 + (i * 5.7 + rng() * 3) % 96;
      const base = 26 + rng() * 8;
      const s = 0.65 + rng() * 0.22;
      all.push({ x, base, s, stage: downStage(downStage(health.stage)), z: 10 + Math.floor(base), sway: rng() });
    }
    // Mid row
    for (let i = 0; i < 18; i++) {
      const x = 1 + (i * 6.1 + rng() * 4) % 98;
      const base = 14 + rng() * 12;
      const s = 1.0 + rng() * 0.35;
      all.push({ x, base, s, stage: downStage(health.stage), z: 40 + Math.floor((30 - base) * 2), sway: rng() });
    }
    // Front row (large, low)
    for (let i = 0; i < 14; i++) {
      const x = -2 + (i * 7.5 + rng() * 5) % 104;
      const base = 2 + rng() * 10;
      const s = 1.45 + rng() * 0.5;
      all.push({ x, base, s, stage: health.stage, z: 80 + Math.floor((15 - base) * 3), sway: rng() });
    }
    // Filter: no trees on pond area
    const filtered = all.filter((t) => !inPond(t.x, t.base));
    // Slice to current treeCount, preferring a balanced mix (interleave back/mid/front)
    return filtered.slice(0, Math.min(treeCount, filtered.length));
  }, [treeCount, health.stage, pondBuf]);

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
    // Pond-edge tufts — hug the perimeter so the pond doesn't sit on bare ground.
    const pondCx = (POND.left + POND.right) / 2;
    const pondCy = (POND.bottomMin + POND.bottomMax) / 2;
    const rx = (POND.right - POND.left) / 2 + 1.5;
    const ry = (POND.bottomMax - POND.bottomMin) / 2 + 1.5;
    for (let i = 0; i < 26; i++) {
      const ang = (i / 26) * Math.PI * 2 + rng() * 0.15;
      const x = pondCx + Math.cos(ang) * (rx + rng() * 1.2);
      const base = pondCy + Math.sin(ang) * (ry + rng() * 0.8);
      if (base < 0) continue;
      arr.push({
        x,
        base,
        scale: 0.5 + rng() * 0.5,
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
    for (let i = 0; i < 65; i++) {
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
          // Slimmer, slightly rounder, moderately smaller — applied uniformly to every stage.
          const shapeScaleX = 0.72;
          const shapeScaleY = 0.9;
          const sizeMul = 0.7 * mobileTreeScale;

          return (
            <div
              key={`tr-${i}`}
              className="absolute"
              style={{
                left: `${t.x}%`,
                bottom: `${bottomPct}%`,
                transform: `translateX(-50%) scale(${t.s * sizeMul})`,
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
                  width: 80 * shapeScaleX,
                  height: 14,
                  transform: "translateX(-50%)",
                  background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.32), transparent 70%)",
                  filter: "blur(2px)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  transform: `scaleX(${shapeScaleX}) scaleY(${shapeScaleY})`,
                  transformOrigin: "bottom center",
                }}
              >
                <Tree stage="mature" delay={Math.min(i * 0.03, 0.9)} />

              </div>
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
                transform: `translateX(-50%) scale(${g.scale * (isMobile ? 0.65 : 1)})`,
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
        {unlockedSpecies.includes("butterfly") &&
          ([
            { left: "22%", bottom: "55%", variant: 1 as const, xPath: [0, 30, 10, 40, 0], yPath: [0, -12, 6, -8, 0], dur: 12 },
            { left: "55%", bottom: "42%", variant: 2 as const, xPath: [0, -25, 15, -10, 0], yPath: [0, 8, -14, 4, 0], dur: 14 },
            { left: "78%", bottom: "50%", variant: 3 as const, xPath: [0, 20, -18, 12, 0], yPath: [0, -10, 12, -6, 0], dur: 11 },
          ]).map((b, i) => (
            <motion.div
              key={`bfly-${i}`}
              className="absolute"
              style={{ left: b.left, bottom: b.bottom, zIndex: 200 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: b.xPath, y: b.yPath }}
              transition={{
                opacity: { duration: 0.6 },
                x: { duration: b.dur, repeat: Infinity, ease: "easeInOut" },
                y: { duration: b.dur, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div style={{ transform: `scale(${isMobile ? 0.55 : 1})`, transformOrigin: "center" }}>
                <Creature id="butterfly" variant={b.variant} />
              </div>
            </motion.div>
          ))}
        {unlockedSpecies.includes("bird") && <PerchingBird />}
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

/**
 * Bird that perches on treetops and occasionally flies to a new perch.
 * No continuous screen crossing — brief hops between perch points, then idle.
 */
function PerchingBird() {
  // Perch spots roughly at treetop heights across the scene.
  const perches = useMemo(
    () => [
      { left: "18%", bottom: "42%" },
      { left: "42%", bottom: "48%" },
      { left: "66%", bottom: "44%" },
      { left: "82%", bottom: "50%" },
      { left: "30%", bottom: "38%" },
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cycle = () => {
      // Perch dwell time
      const dwell = 4500 + Math.random() * 3500;
      const t1 = setTimeout(() => {
        if (cancelled) return;
        setFlying(true);
        // Short flight duration
        const t2 = setTimeout(() => {
          if (cancelled) return;
          setIdx((i) => {
            let n = i;
            while (n === i) n = Math.floor(Math.random() * perches.length);
            return n;
          });
          setFlying(false);
          cycle();
        }, 1400);
        timers.push(t2);
      }, dwell);
      timers.push(t1);
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    cycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [perches.length]);

  const perch = perches[idx];

  return (
    <motion.div
      key="bird"
      className="absolute"
      style={{ zIndex: 200, pointerEvents: "none" }}
      initial={{ opacity: 0, left: perch.left, bottom: perch.bottom }}
      animate={{
        opacity: 1,
        left: perch.left,
        bottom: perch.bottom,
      }}
      transition={{
        opacity: { duration: 0.6 },
        left: { duration: 1.3, ease: "easeInOut" },
        bottom: { duration: 1.3, ease: [0.4, -0.2, 0.6, 1.2] },
      }}
    >
      {/* Idle motion while perched: subtle head/body shift. Flight arc while moving. */}
      <motion.div
        animate={
          flying
            ? { y: [0, -10, -4, -8, 0], rotate: [0, -3, 2, -2, 0] }
            : { y: [0, -1.2, 0, 0.6, 0], rotate: [0, 1, 0, -1, 0] }
        }
        transition={
          flying
            ? { duration: 1.3, ease: "easeInOut" }
            : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformOrigin: "center" }}
      >
        <Creature id="bird" />
      </motion.div>
    </motion.div>
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
