import { motion } from "framer-motion";
import { SeedToSprout } from "./forest/SeedToSprout";

/**
 * Loading seedling — a single continuous seed→sprout sequence on the ground.
 */
export function LoadingSeedling({ label = "Growing your forest…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--sky-soft) 0%, var(--sky-day-a) 45%, var(--canvas-warm) 100%)" }}
    >
      {/* Sun */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          position: "absolute",
          top: "18%",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.98 0.12 90), oklch(0.85 0.14 75))",
          boxShadow: "0 0 60px oklch(0.95 0.14 70 / 0.6)",
        }}
      />

      <SeedToSprout size={260} />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-8 display text-lg"
        style={{ color: "var(--delft-deep)" }}
      >
        {label}
      </motion.p>
    </div>
  );
}
