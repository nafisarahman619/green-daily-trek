import { motion } from "framer-motion";
import type { ForestHealth } from "@/lib/transport";

/**
 * Custom vector tree family.
 * All trees share stroke weight 0, layered soft shapes, same shading approach.
 * Sizes are relative — parent sets the wrapper width.
 */

interface TreeProps {
  stage: "seedling" | "sapling" | "young" | "mature";
  wilted?: boolean;
  delay?: number;
  scale?: number;
}

const GREEN = {
  bright: "var(--fern-glow)",
  mid: "var(--fern)",
  deep: "var(--fern-deep)",
  shade: "var(--fern-shade)",
};
const WILT = {
  bright: "oklch(0.75 0.09 65)",
  mid: "oklch(0.58 0.11 55)",
  deep: "oklch(0.42 0.09 50)",
  shade: "oklch(0.32 0.06 45)",
};
const TRUNK = "oklch(0.35 0.05 50)";
const TRUNK_DARK = "oklch(0.25 0.04 45)";

const OUTLINE = "oklch(0.22 0.06 150)";

export function Tree({ stage, wilted, delay = 0, scale = 1 }: TreeProps) {
  const c = wilted ? WILT : GREEN;
  const swayClass = stage === "seedling" ? "sway-fast" : "sway-slow";

  return (
    <motion.svg
      viewBox="0 0 120 160"
      style={{ width: 120 * scale, height: 160 * scale, overflow: "visible" }}
      initial={{ scale: 0.6, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 14 }}
    >
      <g className={swayClass}>
        {stage === "seedling" && (
          <>
            <path d="M60 155 Q60 140 60 128" stroke={TRUNK_DARK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <ellipse cx="52" cy="128" rx="10" ry="6" fill={c.mid} stroke={OUTLINE} strokeWidth="1.2" transform="rotate(-25 52 128)" />
            <ellipse cx="68" cy="128" rx="10" ry="6" fill={c.bright} stroke={OUTLINE} strokeWidth="1.2" transform="rotate(25 68 128)" />
            <path d="M48 126 Q52 122 56 126" stroke={c.deep} strokeWidth="1" fill="none" transform="rotate(-25 52 128)" />
          </>
        )}

        {stage === "sapling" && (
          <>
            {/* Trunk with taper + bark hint */}
            <path d="M56 158 Q57 130 58 100 L62 100 Q63 130 64 158 Z" fill={TRUNK} stroke={OUTLINE} strokeWidth="1.2" />
            <path d="M59 148 Q60 140 60 132" stroke={TRUNK_DARK} strokeWidth="0.8" fill="none" opacity="0.7" />
            {/* Base canopy silhouette (outline) */}
            <path d="M60 68 Q36 68 32 88 Q24 96 38 106 Q42 116 60 112 Q78 116 82 104 Q96 96 88 84 Q86 66 60 68 Z"
              fill={c.deep} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
            {/* Mid-tone cluster lobes */}
            <circle cx="48" cy="86" r="14" fill={c.mid} stroke={OUTLINE} strokeWidth="1.2" />
            <circle cx="72" cy="90" r="15" fill={c.mid} stroke={OUTLINE} strokeWidth="1.2" />
            <circle cx="60" cy="78" r="14" fill={c.mid} stroke={OUTLINE} strokeWidth="1.2" />
            {/* Highlights */}
            <ellipse cx="52" cy="82" rx="7" ry="5" fill={c.bright} opacity="0.9" />
            <ellipse cx="68" cy="86" rx="5" ry="4" fill={c.bright} opacity="0.75" />
            <ellipse cx="60" cy="112" rx="22" ry="4" fill={c.shade} opacity="0.35" />
          </>
        )}

        {stage === "young" && (
          <>
            {/* Trunk — visible tapered shape with bark */}
            <path d="M54 160 Q56 128 57 92 L63 92 Q64 128 66 160 Z" fill={TRUNK} stroke={OUTLINE} strokeWidth="1.5" />
            <path d="M57 130 Q50 122 44 116" stroke={TRUNK_DARK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M60 140 L60 100" stroke={TRUNK_DARK} strokeWidth="0.9" fill="none" opacity="0.55" />
            <path d="M56 118 L64 118" stroke={TRUNK_DARK} strokeWidth="0.8" fill="none" opacity="0.4" />

            {/* Canopy silhouette — outlined dark base */}
            <path d="M60 40 Q30 42 20 64 Q10 78 24 92 Q18 108 42 110 Q52 122 66 114 Q86 118 94 100 Q108 92 98 74 Q102 56 82 50 Q78 34 60 40 Z"
              fill={c.deep} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />

            {/* Mid-green cluster lobes for depth */}
            <circle cx="40" cy="74" r="18" fill={c.mid} stroke={OUTLINE} strokeWidth="1.3" />
            <circle cx="62" cy="62" r="20" fill={c.mid} stroke={OUTLINE} strokeWidth="1.3" />
            <circle cx="82" cy="76" r="18" fill={c.mid} stroke={OUTLINE} strokeWidth="1.3" />
            <circle cx="50" cy="92" r="16" fill={c.mid} stroke={OUTLINE} strokeWidth="1.3" />
            <circle cx="76" cy="94" r="15" fill={c.mid} stroke={OUTLINE} strokeWidth="1.3" />

            {/* Highlight crescents */}
            <path d="M34 66 Q40 58 50 60" stroke={c.bright} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M58 52 Q66 48 74 54" stroke={c.bright} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
            <ellipse cx="46" cy="84" rx="5" ry="3" fill={c.bright} opacity="0.7" />
            <ellipse cx="78" cy="88" rx="4" ry="3" fill={c.bright} opacity="0.6" />

            <ellipse cx="60" cy="112" rx="34" ry="7" fill={c.shade} opacity="0.4" />
          </>
        )}

        {stage === "mature" && (
          <>
            {/* Trunk — thick tapered with root flare + bark grooves */}
            <path d="M48 160 Q52 128 54 88 L66 88 Q68 128 72 160 Z" fill={TRUNK} stroke={OUTLINE} strokeWidth="1.8" />
            <path d="M58 128 Q46 118 36 106" stroke={TRUNK_DARK} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M62 116 Q74 106 84 96" stroke={TRUNK_DARK} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M60 148 L60 96" stroke={TRUNK_DARK} strokeWidth="1.1" fill="none" opacity="0.55" />
            <path d="M54 138 L66 138 M55 118 L65 118 M56 104 L64 104" stroke={TRUNK_DARK} strokeWidth="0.9" fill="none" opacity="0.45" />

            {/* Canopy silhouette — dark outlined base, generous scalloped edge */}
            <path d="M60 18 Q26 22 14 50 Q0 66 16 84 Q6 104 32 110 Q40 124 62 118 Q88 124 100 106 Q120 96 110 74 Q122 54 100 44 Q94 20 60 18 Z"
              fill={c.deep} stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />

            {/* Multiple mid-green foliage clusters — each with its own outline for definition */}
            <circle cx="32" cy="58" r="22" fill={c.mid} stroke={OUTLINE} strokeWidth="1.5" />
            <circle cx="58" cy="42" r="24" fill={c.mid} stroke={OUTLINE} strokeWidth="1.5" />
            <circle cx="86" cy="56" r="22" fill={c.mid} stroke={OUTLINE} strokeWidth="1.5" />
            <circle cx="42" cy="86" r="20" fill={c.mid} stroke={OUTLINE} strokeWidth="1.5" />
            <circle cx="72" cy="90" r="21" fill={c.mid} stroke={OUTLINE} strokeWidth="1.5" />
            <circle cx="60" cy="70" r="18" fill={c.mid} stroke={OUTLINE} strokeWidth="1.5" />

            {/* Bright highlight lobes — sunlit tops */}
            <path d="M22 50 Q30 38 44 42" stroke={c.bright} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9" />
            <path d="M50 32 Q60 26 72 32" stroke={c.bright} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9" />
            <path d="M78 48 Q88 42 96 52" stroke={c.bright} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9" />
            <ellipse cx="38" cy="80" rx="6" ry="4" fill={c.bright} opacity="0.7" />
            <ellipse cx="74" cy="82" rx="6" ry="4" fill={c.bright} opacity="0.7" />

            {/* Leaf-fleck accents */}
            <circle cx="24" cy="72" r="2.2" fill={c.bright} opacity="0.7" />
            <circle cx="98" cy="72" r="2.2" fill={c.bright} opacity="0.7" />
            <circle cx="60" cy="24" r="2" fill={c.bright} opacity="0.6" />
            <circle cx="46" cy="102" r="2" fill={c.bright} opacity="0.6" />
            <circle cx="80" cy="104" r="2" fill={c.bright} opacity="0.6" />

            <ellipse cx="60" cy="118" rx="46" ry="10" fill={c.shade} opacity="0.4" />
          </>
        )}
      </g>
    </motion.svg>
  );
}

/* ---------------- Flowers, grass, pond, clouds, wildlife ---------------- */

export function Wildflower({ variant, delay = 0 }: { variant: 1 | 2 | 3; delay?: number }) {
  const palette =
    variant === 1
      ? { petal: "oklch(0.78 0.19 25)", petalDeep: "oklch(0.55 0.18 25)", center: "oklch(0.92 0.18 90)" }
      : variant === 2
      ? { petal: "oklch(0.82 0.16 320)", petalDeep: "oklch(0.55 0.18 320)", center: "oklch(0.95 0.15 90)" }
      : { petal: "oklch(0.9 0.17 90)", petalDeep: "oklch(0.65 0.18 70)", center: "oklch(0.55 0.18 30)" };
  return (
    <motion.svg
      viewBox="0 0 40 60"
      style={{ width: 30, height: 44, overflow: "visible" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
    >
      {/* Stem */}
      <path d="M20 58 Q19 44 20 30" stroke={GREEN.deep} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Leaf */}
      <path d="M20 44 Q10 42 12 36 Q18 38 20 44 Z" fill={GREEN.mid} stroke={GREEN.deep} strokeWidth="1" />
      <g className="sway-fast">
        {/* 5 outlined petals around a center */}
        <circle cx="20" cy="14" r="7" fill={palette.petal} stroke={palette.petalDeep} strokeWidth="1.4" />
        <circle cx="10" cy="20" r="7" fill={palette.petal} stroke={palette.petalDeep} strokeWidth="1.4" />
        <circle cx="30" cy="20" r="7" fill={palette.petal} stroke={palette.petalDeep} strokeWidth="1.4" />
        <circle cx="14" cy="28" r="7" fill={palette.petal} stroke={palette.petalDeep} strokeWidth="1.4" />
        <circle cx="26" cy="28" r="7" fill={palette.petal} stroke={palette.petalDeep} strokeWidth="1.4" />
        {/* Center */}
        <circle cx="20" cy="22" r="4.5" fill={palette.center} stroke={palette.petalDeep} strokeWidth="1.2" />
        <circle cx="20" cy="22" r="1.5" fill={palette.petalDeep} opacity="0.7" />
      </g>
    </motion.svg>
  );
}

export function Cloud({ scale = 1, opacity = 0.85 }: { scale?: number; opacity?: number }) {
  return (
    <svg viewBox="0 0 160 60" style={{ width: 160 * scale, height: 60 * scale }}>
      <g fill="white" opacity={opacity}>
        <ellipse cx="40" cy="38" rx="30" ry="18" />
        <ellipse cx="72" cy="30" rx="26" ry="20" />
        <ellipse cx="104" cy="36" rx="28" ry="18" />
        <ellipse cx="128" cy="40" rx="20" ry="14" />
      </g>
    </svg>
  );
}

export function Pond() {
  return (
    <svg viewBox="0 0 220 60" style={{ width: "100%", height: 60 }}>
      <defs>
        <linearGradient id="pondG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--sky-deep)" />
          <stop offset="100%" stopColor="var(--delft)" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="34" rx="105" ry="22" fill="url(#pondG)" />
      <ellipse cx="70" cy="30" rx="30" ry="4" fill="white" opacity="0.35" className="shimmer-water" />
      <ellipse cx="140" cy="38" rx="24" ry="3" fill="white" opacity="0.25" className="shimmer-water" style={{ animationDelay: "1.5s" }} />
    </svg>
  );
}

export function GrassTuft({ delay = 0 }: { delay?: number }) {
  return (
    <svg viewBox="0 0 30 24" style={{ width: 30, height: 24, overflow: "visible" }}>
      <g className="sway-fast" style={{ animationDelay: `${delay}s` }}>
        <path d="M6 24 Q4 12 10 4" stroke={GREEN.deep} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M15 24 Q15 10 18 2" stroke={GREEN.mid} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M24 24 Q26 12 22 4" stroke={GREEN.deep} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* Wildlife — matching flat-vector family */
export function Creature({ id }: { id: string }) {
  switch (id) {
    case "butterfly":
      return (
        <svg viewBox="0 0 40 30" style={{ width: 32, height: 24, overflow: "visible" }}>
          <g className="float-y">
            <ellipse cx="14" cy="12" rx="10" ry="8" fill="oklch(0.72 0.16 30)" />
            <ellipse cx="14" cy="20" rx="8" ry="6" fill="oklch(0.82 0.14 45)" />
            <ellipse cx="26" cy="12" rx="10" ry="8" fill="oklch(0.72 0.16 30)" />
            <ellipse cx="26" cy="20" rx="8" ry="6" fill="oklch(0.82 0.14 45)" />
            <rect x="19" y="8" width="2" height="16" rx="1" fill={TRUNK_DARK} />
          </g>
        </svg>
      );
    case "rabbit":
      return (
        <svg viewBox="0 0 60 50" style={{ width: 48, height: 40 }}>
          <ellipse cx="30" cy="38" rx="18" ry="10" fill="oklch(0.85 0.02 60)" />
          <circle cx="42" cy="30" r="9" fill="oklch(0.85 0.02 60)" />
          <ellipse cx="40" cy="18" rx="3" ry="8" fill="oklch(0.85 0.02 60)" />
          <ellipse cx="46" cy="18" rx="3" ry="8" fill="oklch(0.85 0.02 60)" />
          <circle cx="44" cy="29" r="1.5" fill={TRUNK_DARK} />
          <circle cx="14" cy="36" r="4" fill="white" />
        </svg>
      );
    case "bird":
      return (
        <svg viewBox="0 0 50 40" style={{ width: 40, height: 32 }}>
          <ellipse cx="26" cy="24" rx="14" ry="10" fill="oklch(0.55 0.13 240)" />
          <circle cx="36" cy="18" r="7" fill="oklch(0.55 0.13 240)" />
          <path d="M12 24 Q4 18 8 30 Z" fill="oklch(0.42 0.12 245)" />
          <circle cx="38" cy="16" r="1.5" fill="white" />
          <path d="M42 18 L48 20 L42 22 Z" fill="oklch(0.7 0.15 55)" />
        </svg>
      );
    case "firefly":
      return (
        <svg viewBox="0 0 30 30" style={{ width: 30, height: 30, overflow: "visible" }}>
          <g className="firefly">
            <circle cx="15" cy="15" r="6" fill="oklch(0.9 0.18 100)" opacity="0.5" />
            <circle cx="15" cy="15" r="3" fill="oklch(0.98 0.15 100)" />
          </g>
        </svg>
      );
    case "deer":
      return (
        <svg viewBox="0 0 70 60" style={{ width: 60, height: 52 }}>
          <ellipse cx="34" cy="42" rx="20" ry="11" fill="oklch(0.55 0.08 55)" />
          <rect x="20" y="46" width="4" height="10" fill="oklch(0.4 0.06 45)" />
          <rect x="44" y="46" width="4" height="10" fill="oklch(0.4 0.06 45)" />
          <circle cx="52" cy="30" r="9" fill="oklch(0.55 0.08 55)" />
          <path d="M50 22 L46 12 M54 22 L58 12" stroke="oklch(0.35 0.05 45)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="54" cy="30" r="1.5" fill={TRUNK_DARK} />
        </svg>
      );
    case "fox":
      return (
        <svg viewBox="0 0 70 50" style={{ width: 56, height: 40 }}>
          <path d="M8 42 Q4 36 12 30 L20 34 Z" fill="oklch(0.62 0.15 40)" />
          <ellipse cx="36" cy="36" rx="18" ry="10" fill="oklch(0.65 0.16 40)" />
          <path d="M50 30 L58 24 L60 34 Z" fill="oklch(0.65 0.16 40)" />
          <path d="M52 28 L56 22 L58 30 Z" fill="white" />
          <circle cx="56" cy="30" r="1.5" fill={TRUNK_DARK} />
        </svg>
      );
    default:
      return null;
  }
}
