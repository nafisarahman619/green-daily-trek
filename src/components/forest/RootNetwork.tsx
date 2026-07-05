import { useMemo } from "react";
import { motion } from "framer-motion";
import { rootDensityLevel } from "@/hooks/use-lifetime-saved";

interface RootNetworkProps {
  lifetimeCO2Saved: number;
}

/**
 * An independent underground "root / mycelium" visualization.
 * Purely additive — not tied to any tree above. Grows denser with
 * lifetime CO2 saved, and never shrinks.
 */
export function RootNetwork({ lifetimeCO2Saved }: RootNetworkProps) {
  const level = rootDensityLevel(lifetimeCO2Saved);

  // Number of main root strands based on milestone.
  const strandCount = [4, 7, 11, 16, 22, 30][level];
  // Sub-branches per strand.
  const branchDepth = [1, 2, 2, 3, 3, 4][level];
  // Number of mycelium glow nodes.
  const nodeCount = [6, 12, 22, 36, 55, 80][level];

  const strands = useMemo(
    () => buildStrands(strandCount, branchDepth, level),
    [strandCount, branchDepth, level],
  );
  const nodes = useMemo(() => buildNodes(nodeCount, level), [nodeCount, level]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.22 0.05 40) 0%, oklch(0.15 0.05 40) 55%, oklch(0.10 0.04 40) 100%)",
        aspectRatio: "16 / 6",
        boxShadow: "inset 0 8px 24px oklch(0 0 0 / 0.5), 0 8px 24px oklch(0 0 0 / 0.15)",
      }}
      aria-label="Underground root network"
    >
      {/* Soil grain speckle */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 300">
        {Array.from({ length: 140 }).map((_, i) => {
          const x = ((i * 2654435761) >>> 0) % 800;
          const y = (((i * 40503) >>> 0) % 300);
          return (
            <circle
              key={`sp-${i}`}
              cx={x}
              cy={y}
              r={0.6 + (i % 3) * 0.3}
              fill="oklch(0.35 0.04 45)"
              opacity={0.35}
            />
          );
        })}

        {/* Root strands */}
        <g fill="none" strokeLinecap="round">
          {strands.map((s, i) => (
            <motion.path
              key={`s-${i}`}
              d={s.d}
              stroke={s.color}
              strokeWidth={s.width}
              opacity={s.opacity}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: (i % 8) * 0.06, ease: "easeOut" }}
            />
          ))}
        </g>

        {/* Mycelium glow nodes */}
        <g>
          {nodes.map((n, i) => (
            <motion.circle
              key={`n-${i}`}
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="oklch(0.85 0.14 95)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.65, 0.25] }}
              transition={{
                duration: 3 + (i % 5) * 0.4,
                delay: (i % 7) * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ filter: "blur(0.4px)" }}
            />
          ))}
        </g>
      </svg>

      {/* Empty state hint */}
      {level === 0 && (
        <div
          className="absolute inset-0 grid place-items-center px-6 text-center text-xs"
          style={{ color: "oklch(0.75 0.05 80)" }}
        >
          Log low-emission trips to begin weaving your root network.
        </div>
      )}
    </div>
  );
}

interface Strand {
  d: string;
  width: number;
  opacity: number;
  color: string;
}

function buildStrands(count: number, depth: number, level: number): Strand[] {
  const rng = mulberry32(2027 + level);
  const out: Strand[] = [];
  const palette = ["oklch(0.65 0.12 55)", "oklch(0.55 0.14 45)", "oklch(0.72 0.10 90)"];

  for (let i = 0; i < count; i++) {
    // Start along the top edge (surface line).
    const startX = 10 + ((800 - 20) * i) / Math.max(1, count - 1) + (rng() - 0.5) * 30;
    const startY = 4 + rng() * 6;
    const path = growBranch(startX, startY, 90 + (rng() - 0.5) * 40, 60 + rng() * 80, depth, rng);
    out.push({
      d: path,
      width: 1.6 + rng() * 1.4,
      opacity: 0.55 + rng() * 0.3,
      color: palette[Math.floor(rng() * palette.length)],
    });
  }
  return out;
}

// Recursive branch path in SVG "M ... Q ..." commands.
function growBranch(
  x: number,
  y: number,
  angleDeg: number,
  length: number,
  depth: number,
  rng: () => number,
): string {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = x + Math.cos(rad) * length * 0.5 + (rng() - 0.5) * 20;
  const cy = y + Math.sin(rad) * length * 0.5 + (rng() - 0.5) * 12;
  const ex = x + Math.cos(rad) * length;
  const ey = y + Math.sin(rad) * length;
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  if (depth > 0 && ey < 285) {
    const branches = 1 + Math.floor(rng() * 2);
    for (let b = 0; b < branches; b++) {
      const spread = (rng() - 0.5) * 70;
      d += " " + growBranch(ex, ey, angleDeg + spread, length * (0.45 + rng() * 0.25), depth - 1, rng);
    }
  }
  return d;
}

function buildNodes(count: number, level: number) {
  const rng = mulberry32(9091 + level);
  const arr: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: 10 + rng() * 780,
      y: 30 + rng() * 255,
      r: 0.9 + rng() * 1.6,
    });
  }
  return arr;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
