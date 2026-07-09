import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LoadingSeedling } from "@/components/LoadingSeedling";
import { useForestData } from "@/hooks/use-forest";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SPECIES } from "@/lib/wildlife";
import { useTheme, useSoundPref, dailyMotivation } from "@/lib/preferences";
import { Sun, Moon, Volume2, VolumeX, LogOut, Trash2, Info, Award, Sparkles, Camera, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { AVATAR_ACCEPT, AVATAR_BUCKET, AVATAR_MAX_BYTES, signAvatarUrl } from "@/lib/avatars";
import { useRef } from "react";

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
  const [profile, setProfile] = useState<{ display_name: string; avatar_emoji: string; avatar_url: string | null } | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const uid = data!.userId;
      const { data: rows, error } = await supabase
        .from("transport_logs")
        .select("log_date, mode, distance_km, trips, co2_kg, created_at")
        .eq("user_id", uid)
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const header = ["log_date", "mode", "distance_km", "trips", "co2_kg", "created_at"];
      const esc = (v: any) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [
        header.join(","),
        ...(rows ?? []).map((r: any) => header.map((h) => esc(r[h])).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `forest-emissions-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows?.length ?? 0} trip${rows?.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not export your data.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, avatar_emoji, avatar_url")
        .eq("id", user.user.id)
        .maybeSingle();
      setProfile(p as any);
      if (p?.avatar_url) setAvatarSrc(await signAvatarUrl(p.avatar_url));
    })();
  }, []);

  const handleAvatarFile = async (file: File) => {
    if (!AVATAR_ACCEPT.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const uid = data!.userId;
      const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", uid);
      if (dbErr) throw dbErr;
      setProfile((prev) => (prev ? { ...prev, avatar_url: path } : prev));
      setAvatarSrc(await signAvatarUrl(path));
      await qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Profile picture updated.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not upload picture.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


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
      const [logs, unlocks, plantings] = await Promise.all([
        supabase.from("transport_logs").delete().eq("user_id", uid),
        supabase.from("wildlife_unlocks").delete().eq("user_id", uid),
        supabase.from("tree_plantings").delete().eq("user_id", uid),
      ]);
      if (logs.error || unlocks.error || plantings.error) throw logs.error || unlocks.error || plantings.error;
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

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <div
            className="grid h-20 w-20 place-items-center overflow-hidden rounded-full text-3xl"
            style={{ background: "var(--canvas-warm)", border: "1.5px solid var(--border)" }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={`${name}'s profile picture`} className="h-full w-full object-cover" />
            ) : (
              <span>{profile?.avatar_emoji ?? "🌱"}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Upload profile picture"
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full text-white shadow-md transition-transform hover:scale-105 disabled:opacity-60"
            style={{ background: "var(--fern)" }}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarFile(f);
            }}
          />
        </div>
        <div className="min-w-0">
          <h1 className="display text-3xl md:text-4xl">Profile</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            Signed in as <strong style={{ color: "var(--delft-deep)" }}>{name}</strong>.
          </p>
          <p className="mt-1 text-[11px]" style={{ color: "var(--ink-soft)" }}>
            JPG, PNG, or WEBP · up to 5MB
          </p>
        </div>
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
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SPECIES.map((s) => {
              const unlocked = data.unlocks.includes(s.id);
              return (
                <div
                  key={s.id}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border p-3"
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
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
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
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-ghost-delft"
              style={{ padding: "0.7rem 1.1rem" }}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
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
            Download your full trip history as CSV, or reset to start fresh. Resetting cannot be undone.
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
