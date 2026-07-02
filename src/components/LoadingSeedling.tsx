import { motion } from "framer-motion";
import { Tree } from "./forest/Tree";

/**
 * Loading seedling animation — plays under 2.5s.
 * A seed drops, sprouts through soil, becomes a sapling.
 */
export function LoadingSeedling({ label = "Growing your forest…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center" style={{ background: "linear-gradient(180deg, var(--sky-soft), var(--canvas))" }}>
      <div className="relative flex flex-col items-center">
        {/* Sun */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute"
          style={{
            top: -80,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.98 0.12 90), oklch(0.85 0.14 75))",
            boxShadow: "0 0 60px oklch(0.95 0.14 70 / 0.6)",
          }}
        />
        {/* Soil mound */}
        <svg viewBox="0 0 240 80" style={{ width: 240, height: 80 }}>
          <ellipse cx="120" cy="60" rx="110" ry="18" fill="oklch(0.4 0.06 60)" />
          <ellipse cx="120" cy="52" rx="90" ry="12" fill="oklch(0.5 0.08 60)" />
        </svg>
        {/* Seed → sprout */}
        <motion.div
          className="absolute"
          style={{ bottom: 40 }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 1, 1] }}
          transition={{ times: [0, 0.3, 0.7, 1], duration: 2.2 }}
        >
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ times: [0, 0.4, 0.5, 1], duration: 2.2 }}
            style={{
              width: 18, height: 22,
              background: "oklch(0.5 0.09 55)",
              borderRadius: "40% 40% 50% 50%",
              margin: "0 auto",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0, 1, 1], scale: [0.4, 0.4, 1, 1] }}
            transition={{ times: [0, 0.45, 0.85, 1], duration: 2.2 }}
            style={{ marginTop: -30 }}
          >
            <Tree stage="sapling" />
          </motion.div>
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 display text-lg"
        style={{ color: "var(--delft)" }}
      >
        {label}
      </motion.p>
    </div>
  );
}
