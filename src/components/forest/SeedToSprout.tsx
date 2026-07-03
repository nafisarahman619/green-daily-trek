import { motion } from "framer-motion";

interface SeedToSproutProps {
  size?: number;
  /** Total duration of the sequence in seconds (default 2.4). */
  duration?: number;
  /** Loop the sequence (for loading screens). */
  loop?: boolean;
}

/**
 * A single, continuous seed→sprout animation, grounded on soil.
 * The seed sits on the ground, wiggles, cracks open, then a sprout
 * grows upward directly from the seed's position — no floating pieces.
 */
export function SeedToSprout({ size = 240, duration = 2.4, loop = false }: SeedToSproutProps) {
  const D = duration;
  // Timing (fractions of D)
  const tSettle = 0.15;
  const tCrack = 0.35;
  const tSprout = 0.55;
  const tGrow = 1.0;

  const repeat = loop ? Infinity : 0;
  const repeatDelay = loop ? 0.8 : 0;

  // Ground line at ~78% down. Seed rests just at this line.
  const GROUND_Y = 0.78;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {/* Soil mound */}
      <svg
        viewBox="0 0 240 60"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: size * (1 - GROUND_Y) - 18,
          width: "100%",
          height: 60,
        }}
        preserveAspectRatio="none"
      >
        <ellipse cx="120" cy="42" rx="110" ry="16" fill="var(--soil)" />
        <ellipse cx="120" cy="36" rx="92" ry="10" fill="oklch(0.5 0.08 60)" />
        <ellipse cx="120" cy="34" rx="70" ry="5" fill="oklch(0.58 0.09 65)" opacity="0.7" />
      </svg>

      {/* Sequence container anchored on ground */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: size * (1 - GROUND_Y),
          width: 0,
          height: 0,
          transform: "translateX(-50%)",
        }}
      >
        {/* Ground shadow — grows as sprout grows */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0.5 }}
          animate={{ scale: [0.6, 0.7, 0.9, 1.2], opacity: [0.5, 0.55, 0.6, 0.55] }}
          transition={{ duration: D, times: [0, tCrack, tSprout, 1], repeat, repeatDelay }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: -8,
            width: 90,
            height: 14,
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse at center, oklch(0.15 0.04 60 / 0.4), transparent 70%)",
            filter: "blur(3px)",
          }}
        />

        {/* Seed — sits on ground, wobbles, then splits into two halves that fall away */}
        {/* Left half */}
        <motion.div
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, 0, -1, -10, -14],
            y: [0, 0, 0, 4, 8],
            rotate: [0, -6, 6, -35, -55],
            opacity: [1, 1, 1, 1, 0],
          }}
          transition={{ duration: D, times: [0, tSettle, tCrack, tSprout, 0.75], ease: "easeOut", repeat, repeatDelay }}
          style={{
            position: "absolute",
            left: -10,
            bottom: 0,
            width: 10,
            height: 22,
            background: "linear-gradient(135deg, oklch(0.55 0.1 55), oklch(0.38 0.08 50))",
            borderRadius: "80% 0 60% 40% / 100% 0 60% 40%",
            transformOrigin: "bottom right",
            boxShadow: "inset -1px -2px 0 oklch(0.28 0.05 45 / 0.5)",
          }}
        />
        {/* Right half */}
        <motion.div
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, 0, 1, 10, 14],
            y: [0, 0, 0, 4, 8],
            rotate: [0, 6, -6, 35, 55],
            opacity: [1, 1, 1, 1, 0],
          }}
          transition={{ duration: D, times: [0, tSettle, tCrack, tSprout, 0.75], ease: "easeOut", repeat, repeatDelay }}
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 10,
            height: 22,
            background: "linear-gradient(-135deg, oklch(0.55 0.1 55), oklch(0.38 0.08 50))",
            borderRadius: "0 80% 40% 60% / 0 100% 40% 60%",
            transformOrigin: "bottom left",
            boxShadow: "inset 1px -2px 0 oklch(0.28 0.05 45 / 0.5)",
          }}
        />

        {/* Sprout — emerges from seed's exact position and grows upward */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 0, 0.1, 1], opacity: [0, 0, 1, 1] }}
          transition={{ duration: D, times: [0, tCrack, tSprout, tGrow], ease: [0.2, 0.9, 0.3, 1], repeat, repeatDelay }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 2,
            width: 0,
            height: 0,
            transform: "translateX(-50%)",
            transformOrigin: "bottom center",
          }}
        >
          {/* Stem */}
          <svg
            viewBox="0 0 40 100"
            width="60"
            height="140"
            style={{ position: "absolute", left: -30, bottom: 0, overflow: "visible" }}
          >
            <path
              d="M20 100 Q22 70 20 40 Q18 20 20 4"
              stroke="var(--fern-deep)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left leaf */}
            <g style={{ transformOrigin: "20px 55px" }} className="sway-fast">
              <ellipse cx="10" cy="52" rx="12" ry="7" fill="var(--fern)" transform="rotate(-30 10 52)" />
              <ellipse cx="10" cy="52" rx="8" ry="4" fill="var(--fern-glow)" transform="rotate(-30 10 52)" opacity="0.7" />
            </g>
            {/* Right leaf */}
            <g style={{ transformOrigin: "20px 40px" }} className="sway-fast" >
              <ellipse cx="30" cy="36" rx="12" ry="7" fill="var(--fern)" transform="rotate(30 30 36)" />
              <ellipse cx="30" cy="36" rx="8" ry="4" fill="var(--fern-glow)" transform="rotate(30 30 36)" opacity="0.7" />
            </g>
            {/* Top bud */}
            <circle cx="20" cy="6" r="4" fill="var(--fern-glow)" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
