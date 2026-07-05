import { useEffect, useRef, useState } from "react";
import { getInitialSound } from "@/lib/preferences";
import ambienceSrc from "@/assets/forest-ambience.ogg?url";

// A short forest-birds field recording, looped. Bundled locally so it is
// always available and never blocked by hotlink / CORS.
const AMBIENT_SRC = ambienceSrc;

export function AmbientSound() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState<boolean>(() => getInitialSound());
  const [primed, setPrimed] = useState(false);

  // Sync with pref changes fired from Profile toggle.
  useEffect(() => {
    const onPref = (e: Event) => setEnabled((e as CustomEvent<boolean>).detail);
    window.addEventListener("cff:sound", onPref as EventListener);
    return () => window.removeEventListener("cff:sound", onPref as EventListener);
  }, []);

  // Browsers require a user gesture before audio can play. Prime on first
  // interaction, then let the enabled flag drive play/pause.
  useEffect(() => {
    if (primed) return;
    const prime = () => {
      setPrimed(true);
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, [primed]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = 0.25;
    if (enabled && primed) {
      el.play().catch(() => { /* ignored; will retry on next gesture */ });
    } else {
      el.pause();
    }
  }, [enabled, primed]);

  return (
    <audio
      ref={ref}
      src={AMBIENT_SRC}
      loop
      preload="auto"
      aria-hidden="true"
      style={{ display: "none" }}
    />
  );
}
