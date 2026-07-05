import { useEffect, useRef, useState } from "react";
import { getInitialSound } from "@/lib/preferences";

// A soft, looping nature soundscape. Hosted on Pixabay CDN (royalty-free).
const AMBIENT_SRC =
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3";

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
