import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Tree } from "@/components/forest/Tree";
import { SeedToSprout } from "@/components/forest/SeedToSprout";
import { Leaf, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Carbon Footprint Forest" },
      { name: "description", content: "Start your forest journey. Log daily transport, watch your personal ecosystem grow." },
      { property: "og:title", content: "Carbon Footprint Forest — sign in" },
      { property: "og:description", content: "Turn everyday transport into a living forest." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Add a display name").max(40);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [sproutFor, setSproutFor] = useState<null | { name: string }>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const em = emailSchema.parse(email);
      const pw = passwordSchema.parse(password);
      if (mode === "signup") {
        const dn = nameSchema.parse(name);
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: dn, avatar_emoji: "🌱" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation required — no session yet
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
        // Play sprout animation, then go to app
        setSproutFor({ name: dn });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(180deg, var(--sky-soft), var(--canvas))" }}>
      {/* Decorative clouds */}
      <div className="pointer-events-none absolute inset-x-0 top-10 opacity-70 drift-cloud-slow">
        <svg viewBox="0 0 160 60" style={{ width: 160 }}>
          <g fill="white">
            <ellipse cx="40" cy="38" rx="30" ry="18" />
            <ellipse cx="72" cy="30" rx="26" ry="20" />
            <ellipse cx="104" cy="36" rx="28" ry="18" />
          </g>
        </svg>
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-4 py-10 md:flex-row md:justify-between">
        {/* Left — brand + illustration */}
        <div className="max-w-md text-center md:text-left">
          <Link to="/" className="chip-blue mb-6 inline-flex"><Leaf className="h-3.5 w-3.5" /> Carbon Footprint Forest</Link>
          <h1 className="display text-4xl leading-tight md:text-5xl">
            Every trip you take grows a <span style={{ color: "var(--fern)" }}>living forest</span>.
          </h1>
          <p className="mt-4 text-base ink-body" style={{ color: "var(--ink-soft)" }}>
            Log how you moved today. Watch a whole ecosystem breathe with you — trees, birds, fireflies, and a little pond of your own.
          </p>
          <div className="mt-8 hidden justify-center md:flex">
            <Tree stage="mature" />
          </div>
        </div>

        {/* Right — form card */}
        <div className="w-full max-w-md surface-card p-6 md:p-8">
          <div className="mb-6 flex rounded-full p-1" style={{ background: "var(--canvas-warm)" }}>
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 rounded-full py-2 text-sm font-bold transition-colors"
                style={{
                  background: mode === m ? "var(--paper)" : "transparent",
                  color: mode === m ? "var(--delft-deep)" : "var(--ink-soft)",
                  boxShadow: mode === m ? "var(--shadow-soft)" : undefined,
                }}
              >
                {m === "signin" ? "Sign in" : "New here"}
              </button>
            ))}
          </div>


          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={<User className="h-4 w-4" />} placeholder="Display name" value={name} onChange={setName} />
            )}
            <Field icon={<Mail className="h-4 w-4" />} placeholder="you@example.com" type="email" value={email} onChange={setEmail} />
            <Field icon={<Lock className="h-4 w-4" />} placeholder="Password" type="password" value={password} onChange={setPassword} />
            <button type="submit" disabled={busy} className="btn-fern w-full">
              {busy ? "…" : mode === "signin" ? "Enter my forest" : "Plant my seed"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: "var(--ink-soft)" }}>
            No black boxes. Emissions come from a public per-transport lookup, tallied over time.
          </p>
        </div>
      </div>

      {/* Registration sprout animation */}
      <AnimatePresence>
        {sproutFor && <SproutCelebration name={sproutFor.name} onDone={() => navigate({ to: "/app" })} />}
      </AnimatePresence>
    </div>
  );
}

function Field({ icon, placeholder, type = "text", value, onChange }: any) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: "var(--paper)", borderColor: "var(--border)" }}>
      <span style={{ color: "var(--ink-soft)" }}>{icon}</span>
      <input
        className="w-full bg-transparent text-sm outline-none"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}


function SproutCelebration({ name, onDone }: { name: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--sky-day-a) 0%, var(--sky-soft) 50%, var(--canvas-warm) 100%)" }}
    >
      {/* Sun */}
      <div
        style={{
          position: "absolute",
          top: "14%",
          right: "18%",
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.98 0.12 90), oklch(0.85 0.14 75))",
          boxShadow: "0 0 80px oklch(0.95 0.14 70 / 0.55)",
        }}
      />

      <SeedToSprout size={300} duration={2.6} />

      {/* Leaf confetti — falls from above, drifting past the sprout */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="leaf-fall absolute"
            style={{
              top: "20%",
              left: `${40 + ((i * 23) % 20) - 10 + (i % 2 ? 3 : -3)}%`,
              width: 10,
              height: 6,
              background: i % 2 ? "var(--pistachio)" : "var(--fern-glow)",
              borderRadius: "50% 10% 50% 10%",
              animationDelay: `${1.8 + (i % 5) * 0.15}s`,
              // @ts-ignore
              "--fx": `${(i % 2 ? -1 : 1) * (30 + i * 10)}px`,
            }}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9 }}
        className="mt-8 display text-2xl"
        style={{ color: "var(--delft-deep)" }}
      >
        Welcome, {name} 🌱
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="mt-2 text-sm"
        style={{ color: "var(--ink-soft)" }}
      >
        Your forest journey begins today.
      </motion.p>
    </motion.div>
  );
}
