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

        {/* Root strands — tapered organic shapes */}
        <g strokeLinejoin="round">
          {strands.map((s, i) => (
            <motion.path
              key={`s-${i}`}
              d={s.d}
              fill={s.color}
              opacity={s.opacity}
              initial={{ opacity: 0 }}
              animate={{ opacity: s.opacity }}
              transition={{ duration: 0.9, delay: (i % 10) * 0.05, ease: "easeOut" }}
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
  opacity: number;
  color: string;
}

// A single tapered segment: cubic bezier centerline, sampled and offset
// perpendicularly by a shrinking half-width to build a filled polygon.
function taperedSegment(
  x0: number,
  y0: number,
  x3: number,
  y3: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  wStart: number,
  wEnd: number,
  samples = 16,
): string {
  const pts: { x: number; y: number; nx: number; ny: number; w: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    // Cubic bezier point
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x3;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y3;
    // Tangent (derivative)
    const tx =
      3 * mt * mt * (c1x - x0) + 6 * mt * t * (c2x - c1x) + 3 * t * t * (x3 - c2x);
    const ty =
      3 * mt * mt * (c1y - y0) + 6 * mt * t * (c2y - c1y) + 3 * t * t * (y3 - c2y);
    const len = Math.hypot(tx, ty) || 1;
    // Perpendicular unit
    const nx = -ty / len;
    const ny = tx / len;
    // Ease-out taper (roots thin faster near the tip)
    const w = wStart + (wEnd - wStart) * (1 - Math.pow(1 - t, 1.6));
    pts.push({ x, y, nx, ny, w: w / 2 });
  }
  // Left edge start → end, then right edge end → start
  let d = `M ${(pts[0].x + pts[0].nx * pts[0].w).toFixed(1)} ${(pts[0].y + pts[0].ny * pts[0].w).toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${(pts[i].x + pts[i].nx * pts[i].w).toFixed(1)} ${(pts[i].y + pts[i].ny * pts[i].w).toFixed(1)}`;
  }
  // Round the tip a touch
  const tip = pts[pts.length - 1];
  d += ` L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
  for (let i = pts.length - 1; i >= 0; i--) {
    d += ` L ${(pts[i].x - pts[i].nx * pts[i].w).toFixed(1)} ${(pts[i].y - pts[i].ny * pts[i].w).toFixed(1)}`;
  }
  d += " Z";
  return d;
}

function buildStrands(count: number, depth: number, level: number): Strand[] {
  const rng = mulberry32(2027 + level);
  const out: Strand[] = [];
  const palette = [
    "oklch(0.42 0.06 45)",
    "oklch(0.48 0.08 55)",
    "oklch(0.55 0.09 50)",
    "oklch(0.38 0.05 40)",
    "oklch(0.60 0.08 65)",
  ];

  for (let i = 0; i < count; i++) {
    // Start along the surface (top edge).
    const startX = 12 + ((800 - 24) * i) / Math.max(1, count - 1) + (rng() - 0.5) * 34;
    const startY = 2 + rng() * 5;
    const angle = 88 + (rng() - 0.5) * 46; // mostly downward, some tilt
    const length = 70 + rng() * 90;
    const wStart = 4.5 + rng() * 3.2; // thick trunk-base
    const color = palette[Math.floor(rng() * palette.length)];
    const opacity = 0.72 + rng() * 0.22;
    growRoot(out, startX, startY, angle, length, wStart, depth, rng, color, opacity);
  }
  return out;
}

function growRoot(
  out: Strand[],
  x: number,
  y: number,
  angleDeg: number,
  length: number,
  wStart: number,
  depth: number,
  rng: () => number,
  color: string,
  opacity: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  const ex = x + Math.cos(rad) * length;
  const ey = y + Math.sin(rad) * length;

  // Two control points → gentle S-curve, biased sideways for organic bend.
  const bend1 = (rng() - 0.5) * length * 0.55;
  const bend2 = (rng() - 0.5) * length * 0.55;
  const perpX = -Math.sin(rad);
  const perpY = Math.cos(rad);
  const c1x = x + Math.cos(rad) * length * 0.33 + perpX * bend1;
  const c1y = y + Math.sin(rad) * length * 0.33 + perpY * bend1;
  const c2x = x + Math.cos(rad) * length * 0.66 + perpX * bend2;
  const c2y = y + Math.sin(rad) * length * 0.66 + perpY * bend2;

  // Taper — tip is 25–45% of base width, min 0.4 px.
  const wEnd = Math.max(0.4, wStart * (0.25 + rng() * 0.2));

  out.push({
    d: taperedSegment(x, y, ex, ey, c1x, c1y, c2x, c2y, wStart, wEnd),
    color,
    opacity,
  });

  if (depth <= 0 || ey > 288) return;

  // Asymmetric forking — 1–3 children, each starting somewhere along the parent
  // (not just the tip) at varied angles/lengths.
  const forkCount = 1 + Math.floor(rng() * 3);
  for (let b = 0; b < forkCount; b++) {
    // Where along the parent this fork sprouts (0.4–0.95).
    const t = 0.4 + rng() * 0.55;
    const mt = 1 - t;
    const fx =
      mt * mt * mt * x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex;
    const fy =
      mt * mt * mt * y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey;

    // Side bias alternates + noise so branches don't mirror.
    const side = b % 2 === 0 ? 1 : -1;
    const spread = side * (25 + rng() * 45) + (rng() - 0.5) * 15;
    const childAngle = angleDeg + spread;
    const childLen = length * (0.42 + rng() * 0.35);
    // Child base width = parent width at t, slightly reduced.
    const parentWAt = wStart + (wEnd - wStart) * (1 - Math.pow(1 - t, 1.6));
    const childWStart = Math.max(0.6, parentWAt * (0.55 + rng() * 0.25));

    growRoot(
      out,
      fx,
      fy,
      childAngle,
      childLen,
      childWStart,
      depth - 1,
      rng,
      color,
      Math.max(0.4, opacity - 0.05 - rng() * 0.08),
    );
  }
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
