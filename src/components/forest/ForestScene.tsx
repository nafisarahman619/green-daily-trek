import { useMemo } from "react";
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
 * Composed of layered SVG scenery: sky gradient (day/night), drifting clouds,
 * rolling hills, pond, wildflowers, tall grass, trees (count + stage from health),
 * ambient wildlife (persistent unlocks), and optional storm overlay.
 */
export function ForestScene({ health, unlockedSpecies, compact }: ForestSceneProps) {
  const tod = timeOfDay();

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

  // Deterministic scattered positions
  const trees = useMemo(() => {
    const positions = [
      { x: 12, y: 62, s: 0.85, stage: health.stage },
      { x: 82, y: 60, s: 0.9, stage: health.stage },
      { x: 32, y: 68, s: 1.05, stage: health.stage },
      { x: 62, y: 66, s: 1, stage: health.stage },
      { x: 48, y: 58, s: 0.8, stage: downStage(health.stage) },
      { x: 22, y: 78, s: 1.15, stage: health.stage },
      { x: 74, y: 78, s: 1.1, stage: health.stage },
      { x: 4, y: 74, s: 0.7, stage: downStage(health.stage) },
      { x: 92, y: 72, s: 0.75, stage: downStage(health.stage) },
    ];
    return positions.slice(0, treeCount);
  }, [treeCount, health.stage]);

  const flowers = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        x: 5 + i * 9 + (i % 2 ? 3 : 0),
        y: 84 + (i % 3) * 3,
        variant: ((i % 3) + 1) as 1 | 2 | 3,
      })),
    [],
  );

  const grasses = useMemo(
    () => Array.from({ length: 12 }).map((_, i) => ({ x: i * 8 + 2, y: 90 + (i % 2) * 2 })),
    [],
  );

  return (
    <div
      className="relative overflow-hidden rounded-3xl surface-card"
      style={{
        background: skyGradient,
        aspectRatio: compact ? "16 / 9" : "16 / 10",
        boxShadow: "var(--shadow-card), var(--shadow-inner-warm)",
      }}
    >
      {/* Sun / moon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
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

      {/* Clouds */}
      <div className="absolute inset-x-0" style={{ top: "8%" }}>
        <div className="drift-cloud-slow" style={{ opacity: isDark ? 0.4 : 0.9 }}>
          <Cloud scale={0.7} />
        </div>
      </div>
      <div className="absolute inset-x-0" style={{ top: "22%" }}>
        <div className="drift-cloud" style={{ opacity: isDark ? 0.35 : 0.75, animationDelay: "-30s" }}>
          <Cloud scale={0.5} opacity={0.7} />
        </div>
      </div>

      {/* Distant hills */}
      <svg viewBox="0 0 800 300" preserveAspectRatio="none" className="absolute inset-x-0" style={{ top: "48%", height: "35%" }}>
        <path d="M0 200 Q120 120 240 170 T480 160 T800 180 L800 300 L0 300 Z" fill="oklch(0.55 0.09 145)" opacity="0.6" />
        <path d="M0 230 Q160 170 320 200 T640 210 T800 220 L800 300 L0 300 Z" fill="oklch(0.45 0.11 140)" opacity="0.8" />
      </svg>

      {/* Grass ground */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "38%",
          background:
            "linear-gradient(180deg, var(--grass-a) 0%, var(--grass-b) 55%, var(--grass-deep) 100%)",
        }}
      />

      {/* Pond */}
      <div className="absolute" style={{ left: "58%", bottom: "8%", width: "34%" }}>
        <Pond />
      </div>

      {/* Trees */}
      {trees.map((t, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${t.x}%`,
            bottom: `${100 - t.y}%`,
            transform: `translateX(-50%) scale(${t.s})`,
            transformOrigin: "bottom center",
            zIndex: Math.floor(t.y),
          }}
        >
          <Tree stage={t.stage as ForestHealth["stage"]} delay={i * 0.08} />
        </div>
      ))}

      {/* Flowers */}
      {flowers.map((f, i) => (
        <div
          key={`f-${i}`}
          className="absolute"
          style={{ left: `${f.x}%`, bottom: `${100 - f.y}%`, zIndex: 40 }}
        >
          <Wildflower variant={f.variant} delay={0.6 + i * 0.05} />
        </div>
      ))}

      {/* Grass tufts */}
      {grasses.map((g, i) => (
        <div key={`g-${i}`} className="absolute" style={{ left: `${g.x}%`, bottom: `${100 - g.y - 4}%`, zIndex: 30 }}>
          <GrassTuft delay={i * 0.15} />
        </div>
      ))}

      {/* Wildlife (persistent) */}
      <AnimatePresence>
        {unlockedSpecies.includes("butterfly") && (
          <motion.div
            key="bfly"
            className="absolute float-y"
            style={{ left: "20%", bottom: "62%", zIndex: 60 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Creature id="butterfly" />
          </motion.div>
        )}
        {unlockedSpecies.includes("bird") && (
          <motion.div
            key="bird"
            className="absolute float-y"
            style={{ left: "70%", bottom: "68%", zIndex: 60, animationDelay: "-2s" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Creature id="bird" />
          </motion.div>
        )}
        {unlockedSpecies.includes("rabbit") && (
          <motion.div
            key="rab"
            className="absolute"
            style={{ left: "40%", bottom: "10%", zIndex: 55 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Creature id="rabbit" />
          </motion.div>
        )}
        {unlockedSpecies.includes("deer") && (
          <motion.div
            key="deer"
            className="absolute"
            style={{ left: "8%", bottom: "12%", zIndex: 55 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Creature id="deer" />
          </motion.div>
        )}
        {unlockedSpecies.includes("fox") && (
          <motion.div
            key="fox"
            className="absolute"
            style={{ left: "78%", bottom: "8%", zIndex: 55 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Creature id="fox" />
          </motion.div>
        )}
        {unlockedSpecies.includes("firefly") &&
          [0, 1, 2, 3].map((i) => (
            <div
              key={`ff-${i}`}
              className="absolute"
              style={{
                left: `${30 + i * 15}%`,
                bottom: `${28 + (i % 2) * 12}%`,
                zIndex: 60,
              }}
            >
              <Creature id="firefly" />
            </div>
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
            className="absolute inset-0"
            style={{
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
