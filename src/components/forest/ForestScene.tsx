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

  // Subtle mouse parallax
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

  // Deterministic scattered positions. All bottom values <= GROUND_TOP so bases sit on/in grass.
  const trees = useMemo(() => {
    const positions = [
      { x: 14, base: 30, s: 0.9,  stage: health.stage },
      { x: 82, base: 28, s: 0.95, stage: health.stage },
      { x: 34, base: 24, s: 1.1,  stage: health.stage },
      { x: 62, base: 26, s: 1.0,  stage: health.stage },
      { x: 48, base: 34, s: 0.75, stage: downStage(health.stage) },
      { x: 24, base: 18, s: 1.2,  stage: health.stage },
      { x: 74, base: 16, s: 1.15, stage: health.stage },
      { x: 6,  base: 22, s: 0.7,  stage: downStage(health.stage) },
      { x: 92, base: 20, s: 0.75, stage: downStage(health.stage) },
    ];
    return positions.slice(0, treeCount);
  }, [treeCount, health.stage]);

  const flowers = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        x: 5 + i * 9 + (i % 2 ? 3 : 0),
        base: 6 + (i % 3) * 3,
        variant: ((i % 3) + 1) as 1 | 2 | 3,
      })),
    [],
  );

  const grasses = useMemo(
    () => Array.from({ length: 14 }).map((_, i) => ({ x: i * 7 + 2, base: 2 + (i % 3) })),
    [],
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl surface-card"
      style={{
        background: skyGradient,
        aspectRatio: compact ? "16 / 9" : "16 / 10",
        boxShadow: "var(--shadow-card), var(--shadow-inner-warm)",
      }}
    >
      {/* Sun / moon (parallax: sky moves opposite mouse) */}
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

      {/* Clouds — parallax background layer */}
      <motion.div
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "6%" }}
        animate={{ x: parallax.x * -18 }}
        transition={{ type: "spring", stiffness: 30, damping: 12 }}
      >
        <div className="drift-cloud-slow" style={{ opacity: isDark ? 0.4 : 0.9 }}>
          <Cloud scale={0.75} />
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "20%" }}
        animate={{ x: parallax.x * -10 }}
        transition={{ type: "spring", stiffness: 30, damping: 12 }}
      >
        <div className="drift-cloud" style={{ opacity: isDark ? 0.35 : 0.75, animationDelay: "-30s" }}>
          <Cloud scale={0.55} opacity={0.7} />
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "32%" }}
        animate={{ x: parallax.x * -6 }}
        transition={{ type: "spring", stiffness: 30, damping: 12 }}
      >
        <div className="drift-cloud" style={{ opacity: isDark ? 0.25 : 0.55, animationDelay: "-70s", animationDuration: "110s" }}>
          <Cloud scale={0.4} opacity={0.55} />
        </div>
      </motion.div>

      {/* Distant hills — parallax slow */}
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

      {/* GROUND — textured grass plane with soil edge */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: `${GROUND_TOP}%` }}
      >
        {/* Soil undershade */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "100%",
            background:
              "linear-gradient(180deg, var(--grass-a) 0%, var(--grass-b) 40%, var(--grass-deep) 78%, var(--soil) 100%)",
          }}
        />
        {/* Grass horizon curve */}
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className="absolute inset-x-0 top-0" style={{ height: 32, transform: "translateY(-14px)" }}>
          <path
            d="M0 40 Q80 10 180 28 T360 22 T540 30 T720 20 T800 26 L800 60 L0 60 Z"
            fill="var(--grass-a)"
          />
          <path
            d="M0 48 Q100 30 220 42 T440 38 T680 44 T800 40 L800 60 L0 60 Z"
            fill="var(--grass-b)"
            opacity="0.7"
          />
        </svg>
        {/* Grass blade texture (subtle) */}
        <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 400 200">
          {Array.from({ length: 60 }).map((_, i) => {
            const x = (i * 7.3) % 400;
            const h = 4 + ((i * 13) % 6);
            const y = 20 + ((i * 17) % 160);
            return (
              <path
                key={i}
                d={`M${x} ${y + h} Q${x + 1} ${y + h / 2} ${x + 2} ${y}`}
                stroke="var(--grass-deep)"
                strokeWidth="0.8"
                fill="none"
                opacity={0.5}
              />
            );
          })}
        </svg>
        {/* Soil line highlight */}
        <div className="absolute inset-x-0" style={{ bottom: 0, height: 8, background: "linear-gradient(180deg, transparent, oklch(0.28 0.06 55 / 0.35))" }} />
      </div>

      {/* Pond */}
      <div className="absolute" style={{ left: "58%", bottom: "6%", width: "34%", zIndex: 20 }}>
        <Pond />
      </div>

      {/* Foreground layer — parallax opposite */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: parallax.x * 8, y: parallax.y * 3 }}
        transition={{ type: "spring", stiffness: 40, damping: 15 }}
      >
        {/* Trees + ground shadows */}
        {trees.map((t, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${t.x}%`,
              bottom: `${t.base}%`,
              transform: `translateX(-50%) scale(${t.s})`,
              transformOrigin: "bottom center",
              zIndex: 50 + Math.floor(t.base),
            }}
          >
            {/* Ground shadow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                bottom: -6,
                width: 100,
                height: 18,
                transform: "translateX(-50%)",
                background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.35), transparent 70%)",
                filter: "blur(2px)",
                pointerEvents: "none",
              }}
            />
            <Tree stage={t.stage as ForestHealth["stage"]} delay={i * 0.08} />
          </div>
        ))}

        {/* Flowers */}
        {flowers.map((f, i) => (
          <div
            key={`f-${i}`}
            className="absolute"
            style={{ left: `${f.x}%`, bottom: `${f.base}%`, zIndex: 45, transform: "translateX(-50%)" }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                bottom: -3,
                width: 24,
                height: 6,
                transform: "translateX(-50%)",
                background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.28), transparent 70%)",
                filter: "blur(1.5px)",
              }}
            />
            <Wildflower variant={f.variant} delay={0.6 + i * 0.05} />
          </div>
        ))}

        {/* Grass tufts */}
        {grasses.map((g, i) => (
          <div
            key={`g-${i}`}
            className="absolute"
            style={{ left: `${g.x}%`, bottom: `${g.base}%`, zIndex: 40, transform: "translateX(-50%)" }}
          >
            <GrassTuft delay={i * 0.15} />
          </div>
        ))}
      </motion.div>

      {/* Wildlife */}
      <AnimatePresence>
        {unlockedSpecies.includes("butterfly") && (
          <motion.div
            key="bfly"
            className="absolute"
            style={{ left: "22%", bottom: "55%", zIndex: 70 }}
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
            style={{ left: "68%", bottom: "60%", zIndex: 70 }}
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
            style={{ left: "40%", bottom: "8%", zIndex: 65 }}
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
          <motion.div
            key="deer"
            className="absolute"
            style={{ left: "8%", bottom: "10%", zIndex: 65 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div style={{ position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", left: "50%", bottom: -4, width: 60, height: 10, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.32), transparent 70%)", filter: "blur(2px)" }} />
              <Creature id="deer" />
            </div>
          </motion.div>
        )}
        {unlockedSpecies.includes("fox") && (
          <motion.div
            key="fox"
            className="absolute"
            style={{ left: "78%", bottom: "6%", zIndex: 65 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
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
              style={{
                left: `${30 + i * 15}%`,
                bottom: `${28 + (i % 2) * 12}%`,
                zIndex: 70,
              }}
              animate={{
                x: [0, 12, -8, 6, 0],
                y: [0, -10, -4, -14, 0],
              }}
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
            style={{ zIndex: 80,
              background: "linear-gradient(180deg, oklch(0.3 0.04 260 / 0.35), oklch(0.2 0.04 260 / 0.15))",
            }}
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

function downStage(s: ForestHealth["stage"]): ForestHealth["stage"] {
  return s === "mature" ? "young" : s === "young" ? "sapling" : s === "sapling" ? "seedling" : "seedling";
}
