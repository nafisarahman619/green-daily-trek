import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LoadingSeedling } from "@/components/LoadingSeedling";
import { useForestData } from "@/hooks/use-forest";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SPECIES } from "@/lib/wildlife";
import { useTheme, useSoundPref, dailyMotivation } from "@/lib/preferences";
import { Sun, Moon, Volume2, VolumeX, LogOut, Trash2, Info, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Carbon Footprint Forest" },
      { name: "description", content: "Your badges, preferences, and account settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, isLoading } = useForestData();
  const { theme, setTheme } = useTheme();
  const { enabled: soundOn, setEnabled: setSoundOn } = useSoundPref();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.user.id)
        .maybeSingle();
      setProfile(p as any);
    })();
  }, []);

  if (isLoading || !data) return <LoadingSeedling label="Loading your profile…" />;

  const name = profile?.display_name ?? "friend";
  const motivation = dailyMotivation(name);

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const uid = data.userId;
      const [logs, unlocks] = await Promise.all([
        supabase.from("transport_logs").delete().eq("user_id", uid),
        supabase.from("wildlife_unlocks").delete().eq("user_id", uid),
      ]);
      if (logs.error || unlocks.error) throw logs.error || unlocks.error;
      await qc.invalidateQueries();
      toast.success("Your forest has been reset to a fresh clearing.");
      setConfirmReset(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reset data. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell>

      <div className="mb-6">
        <h1 className="display text-3xl md:text-4xl">Profile</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Signed in as <strong style={{ color: "var(--delft-deep)" }}>{name}</strong>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Badges */}
        <section className="surface-card p-6 md:col-span-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" style={{ color: "var(--fern)" }} />
            <h2 className="display text-xl">Achievement badges</h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            Earned from your streaks, low-emission days, and milestones.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SPECIES.map((s) => {
              const unlocked = data.unlocks.includes(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{
                    background: unlocked
                      ? "color-mix(in oklab, var(--pistachio) 28%, var(--paper))"
                      : "var(--paper)",
                    borderColor: "var(--border)",
                    opacity: unlocked ? 1 : 0.45,
                    filter: unlocked ? "none" : "grayscale(1)",
                  }}
                >
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                    style={{ background: "var(--canvas-warm)" }}
                  >
                    {s.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: "var(--delft-deep)" }}>
                      {s.name}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: "var(--ink-soft)" }}>
                      {unlocked ? "Earned" : s.requirement}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Theme */}
        <section className="surface-card p-6">
          <h2 className="display text-xl">Theme</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            Choose how the forest lights up.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className="flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-semibold transition-colors"
              style={{
                background: theme === "light" ? "color-mix(in oklab, var(--pistachio) 35%, var(--paper))" : "var(--paper)",
                borderColor: theme === "light" ? "var(--fern)" : "var(--border)",
                color: "var(--delft-deep)",
              }}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className="flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-semibold transition-colors"
              style={{
                background: theme === "dark" ? "color-mix(in oklab, var(--pistachio) 35%, var(--paper))" : "var(--paper)",
                borderColor: theme === "dark" ? "var(--fern)" : "var(--border)",
                color: "var(--delft-deep)",
              }}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          </div>
        </section>

        {/* Sound */}
        <section className="surface-card p-6">
          <h2 className="display text-xl">Ambient sound</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            A soft loop of birds and forest air while you use the app.
          </p>
          <button
            type="button"
            onClick={() => setSoundOn(!soundOn)}
            className="mt-4 flex w-full items-center justify-between rounded-2xl border p-4"
            style={{ background: "var(--paper)", borderColor: "var(--border)" }}
          >
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--delft-deep)" }}>
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {soundOn ? "Sound is on" : "Sound is off"}
            </span>
            <span
              className="grid h-6 w-11 items-center rounded-full transition-colors"
              style={{
                background: soundOn ? "var(--fern)" : "var(--input)",
                gridTemplateColumns: "1fr",
                padding: "2px",
              }}
            >
              <span
                className="h-5 w-5 rounded-full bg-white transition-transform"
                style={{ transform: soundOn ? "translateX(20px)" : "translateX(0)" }}
              />
            </span>
          </button>
          {soundOn && (
            <p className="mt-2 text-[11px]" style={{ color: "var(--ink-soft)" }}>
              Tip: some browsers wait for a tap before playing audio.
            </p>
          )}
        </section>

        {/* About */}
        <section className="surface-card p-6 md:col-span-2">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" style={{ color: "var(--delft)" }} />
            <h2 className="display text-xl">About Carbon Footprint Forest</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Carbon Footprint Forest turns your daily travel into a living scene. Log how
            you moved — walked, cycled, took the metro, drove — and the app estimates the
            CO₂ of your trips. Lower-emission days keep your forest healthy: trees flourish,
            wildlife arrives, and the pond stays clear. It's a warm, non-preachy way to
            notice your habits and celebrate the good days.
          </p>
        </section>

        {/* Reset + Sign out */}
        <section className="surface-card p-6 md:col-span-2">
          <h2 className="display text-xl">Account</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-ghost-delft"
              style={{ padding: "0.7rem 1.1rem" }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors"
              style={{
                background: "color-mix(in oklab, var(--destructive) 12%, var(--paper))",
                color: "var(--destructive)",
                border: "1.5px solid color-mix(in oklab, var(--destructive) 40%, transparent)",
              }}
            >
              <Trash2 className="h-4 w-4" /> Reset my data
            </button>
          </div>
          <p className="mt-3 text-[12px]" style={{ color: "var(--ink-soft)" }}>
            Resetting clears every logged trip and every unlocked species. This cannot be undone.
          </p>
        </section>
      </div>

      {/* Reset confirmation dialog */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          style={{ background: "color-mix(in oklab, black 45%, transparent)" }}
          onClick={() => !resetting && setConfirmReset(false)}
        >
          <div
            className="surface-card w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="display text-xl">Reset your forest?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
              This deletes all your logged trips and unlocked species. Your account stays,
              but your forest starts from a fresh clearing. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setConfirmReset(false)}
                className="btn-ghost-delft flex-1"
                style={{ padding: "0.6rem 1rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleReset}
                className="flex-1 rounded-full px-4 py-2 text-sm font-bold"
                style={{
                  background: "var(--destructive)",
                  color: "var(--destructive-foreground)",
                }}
              >
                {resetting ? "Resetting…" : "Yes, reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
