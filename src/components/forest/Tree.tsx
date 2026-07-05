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
            {/* two tiny leaves + stem */}
            <path d="M60 155 Q60 140 60 128" stroke={c.deep} strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="52" cy="128" rx="10" ry="6" fill={c.mid} transform="rotate(-25 52 128)" />
            <ellipse cx="68" cy="128" rx="10" ry="6" fill={c.bright} transform="rotate(25 68 128)" />
            <ellipse cx="52" cy="128" rx="6" ry="3" fill={c.deep} transform="rotate(-25 52 128)" opacity="0.35" />
          </>
        )}
        {stage === "sapling" && (
          <>
            <path d="M60 155 Q59 130 58 100" stroke={TRUNK} strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* organic leaf-cluster canopy */}
            <path d="M60 74 Q40 70 38 88 Q30 94 42 102 Q46 112 60 108 Q76 112 80 100 Q92 94 82 84 Q82 68 60 74 Z" fill={c.mid} />
            <path d="M50 78 Q40 80 42 92 Q50 96 58 90 Q60 82 50 78 Z" fill={c.bright} />
            <path d="M70 84 Q80 84 78 96 Q68 100 66 92 Q66 84 70 84 Z" fill={c.deep} />
            <ellipse cx="60" cy="104" rx="20" ry="6" fill={c.shade} opacity="0.35" />
          </>
        )}
        {stage === "young" && (
          <>
            <path d="M60 158 Q59 125 58 92" stroke={TRUNK} strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M58 128 Q50 122 44 116" stroke={TRUNK_DARK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* organic layered canopy blob */}
            <path d="M60 46 Q34 46 24 66 Q14 78 26 92 Q22 108 44 108 Q52 118 66 112 Q84 116 92 100 Q104 92 96 76 Q100 58 82 54 Q76 40 60 46 Z" fill={c.deep} />
            <path d="M62 52 Q42 52 34 68 Q26 80 38 90 Q40 102 58 100 Q76 104 82 92 Q92 82 84 70 Q82 56 62 52 Z" fill={c.mid} />
            <path d="M52 58 Q40 60 38 74 Q42 84 54 82 Q64 80 62 68 Q60 58 52 58 Z" fill={c.bright} />
            <path d="M74 66 Q84 68 84 82 Q78 90 70 84 Q66 74 74 66 Z" fill={c.bright} opacity="0.85" />
            <ellipse cx="60" cy="106" rx="30" ry="8" fill={c.shade} opacity="0.35" />
            <circle cx="46" cy="66" r="4" fill={c.bright} opacity="0.7" />
            <circle cx="80" cy="82" r="3" fill={c.bright} opacity="0.6" />
          </>
        )}
        {stage === "mature" && (
          <>
            <path d="M60 160 Q58 122 58 88" stroke={TRUNK} strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M58 128 Q46 118 38 108" stroke={TRUNK_DARK} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M58 118 Q68 108 78 100" stroke={TRUNK_DARK} strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Rich layered organic canopy */}
            <path d="M60 24 Q28 26 16 52 Q4 68 18 84 Q10 102 34 108 Q42 122 62 116 Q86 122 96 104 Q114 96 106 76 Q116 58 96 46 Q92 26 60 24 Z" fill={c.deep} />
            <path d="M60 30 Q34 32 24 54 Q14 68 28 82 Q24 98 46 104 Q54 114 66 110 Q84 116 92 100 Q106 92 100 76 Q106 60 88 50 Q84 30 60 30 Z" fill={c.mid} />
            <path d="M58 38 Q40 40 32 58 Q26 72 40 82 Q44 94 60 92 Q76 96 82 82 Q92 74 84 62 Q84 46 58 38 Z" fill={c.bright} />
            <path d="M48 50 Q38 54 40 68 Q50 76 58 68 Q62 58 48 50 Z" fill={c.bright} opacity="0.9" />
            <path d="M74 56 Q86 58 84 76 Q74 82 68 72 Q68 58 74 56 Z" fill={c.mid} opacity="0.9" />
            <ellipse cx="60" cy="108" rx="42" ry="10" fill={c.shade} opacity="0.4" />
            <circle cx="42" cy="58" r="6" fill={c.bright} opacity="0.85" />
            <circle cx="82" cy="66" r="5" fill={c.bright} opacity="0.75" />
            <circle cx="60" cy="46" r="4" fill={c.bright} opacity="0.6" />
          </>
        )}
      </g>
    </motion.svg>
  );
}

/* ---------------- Flowers, grass, pond, clouds, wildlife ---------------- */

export function Wildflower({ variant, delay = 0 }: { variant: 1 | 2 | 3; delay?: number }) {
  const petal =
    variant === 1 ? "oklch(0.85 0.15 30)" :
    variant === 2 ? "oklch(0.88 0.12 320)" :
                    "oklch(0.9 0.14 90)";
  return (
    <motion.svg
      viewBox="0 0 40 60"
      style={{ width: 22, height: 32, overflow: "visible" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
    >
      <path d="M20 58 L20 30" stroke={GREEN.deep} strokeWidth="2" strokeLinecap="round" />
      <g className="sway-fast">
        <circle cx="20" cy="18" r="6" fill={petal} />
        <circle cx="12" cy="22" r="5" fill={petal} />
        <circle cx="28" cy="22" r="5" fill={petal} />
        <circle cx="20" cy="26" r="5" fill={petal} />
        <circle cx="20" cy="22" r="3" fill="oklch(0.95 0.15 90)" />
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
