import type { ForestTier } from "@/lib/forest-theme";

/**
 * Decorative overlay for the app chrome — sits behind content, pointer-events none.
 * Never rendered inside the ForestScene.
 */
export function ThemeDecorations({ tier }: { tier: ForestTier }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {tier === "withering" && <WitheringDeco />}
      {tier === "recovering" && <RecoveringDeco />}
      {tier === "thriving" && <ThrivingDeco />}
      {tier === "flourishing" && <FlourishingDeco />}
    </div>
  );
}

/* ---------- Tier 1: dry branches + fallen leaves ---------- */
function WitheringDeco() {
  return (
    <>
      <Branch style={{ top: "8%", left: "-2%", transform: "rotate(-18deg)", opacity: 0.35 }} />
      <Branch style={{ top: "62%", right: "-3%", transform: "rotate(160deg) scale(0.85)", opacity: 0.3 }} />
      <Branch style={{ bottom: "6%", left: "10%", transform: "rotate(20deg) scale(0.7)", opacity: 0.28 }} />
      <DryLeaf style={{ top: "18%", right: "12%" }} rotate={22} />
      <DryLeaf style={{ top: "40%", left: "6%" }} rotate={-40} />
      <DryLeaf style={{ bottom: "18%", right: "20%" }} rotate={70} />
      <DryLeaf style={{ bottom: "30%", left: "38%" }} rotate={-10} />
    </>
  );
}

/* ---------- Tier 2: fewer branches + green sprigs ---------- */
function RecoveringDeco() {
  return (
    <>
      <Branch style={{ top: "10%", left: "-2%", transform: "rotate(-14deg) scale(0.85)", opacity: 0.22 }} />
      <Branch style={{ bottom: "8%", right: "-2%", transform: "rotate(170deg) scale(0.75)", opacity: 0.2 }} />
      <Sprig style={{ top: "22%", right: "8%" }} rotate={15} />
      <Sprig style={{ top: "58%", left: "4%" }} rotate={-25} />
      <Sprig style={{ bottom: "14%", left: "44%" }} rotate={10} />
      <Sprig style={{ bottom: "24%", right: "16%" }} rotate={40} />
    </>
  );
}

/* ---------- Tier 3: lush foliage + bright flowers ---------- */
function ThrivingDeco() {
  return (
    <>
      <Foliage style={{ top: "-4%", left: "-4%", transform: "scale(1.05)" }} />
      <Foliage style={{ bottom: "-6%", right: "-4%", transform: "scale(1.1) rotate(180deg)" }} />
      <Flower style={{ top: "14%", right: "10%" }} color="var(--pistachio)" />
      <Flower style={{ top: "48%", left: "3%" }} color="var(--fern-glow)" />
      <Flower style={{ bottom: "18%", right: "24%" }} color="var(--pistachio)" />
      <Flower style={{ bottom: "8%", left: "30%" }} color="var(--fern-glow)" />
    </>
  );
}

/* ---------- Tier 4: cherry blossoms + tiny flowers floating ---------- */
function FlourishingDeco() {
  const petals = Array.from({ length: 14 }).map((_, i) => {
    const left = (i * 137) % 100;
    const delay = (i * 0.7) % 6;
    const duration = 9 + ((i * 3) % 7);
    const size = 10 + ((i * 7) % 10);
    const hue = i % 3 === 0 ? "#ffd6e4" : i % 3 === 1 ? "#ffb8cf" : "#ffe7c2";
    return { left, delay, duration, size, hue, i };
  });
  return (
    <>
      <Foliage style={{ top: "-4%", left: "-4%", transform: "scale(1.05)" }} pink />
      <Foliage style={{ bottom: "-6%", right: "-4%", transform: "scale(1.1) rotate(180deg)" }} pink />
      {petals.map((p) => (
        <span
          key={p.i}
          className="petal-fall"
          style={{
            position: "absolute",
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.7,
            background: p.hue,
            borderRadius: "60% 40% 60% 40% / 60% 60% 40% 40%",
            opacity: 0.85,
            filter: "drop-shadow(0 1px 2px rgba(180,120,140,0.25))",
            animation: `petalFall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <Flower style={{ top: "22%", right: "12%" }} color="#ffb8cf" />
      <Flower style={{ bottom: "20%", left: "8%" }} color="#ffd390" />
      <Flower style={{ top: "60%", right: "6%" }} color="#ffd6e4" />
    </>
  );
}

/* ---------- Primitive SVG shapes ---------- */

function Branch({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 60"
      width="220"
      height="66"
      style={{ position: "absolute", ...style }}
    >
      <path
        d="M2 40 Q 60 30, 90 34 T 198 24"
        stroke="#8a6e50"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M60 34 L 50 20" stroke="#8a6e50" strokeWidth="2" strokeLinecap="round" />
      <path d="M110 32 L 120 18" stroke="#8a6e50" strokeWidth="2" strokeLinecap="round" />
      <path d="M150 28 L 158 40" stroke="#8a6e50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DryLeaf({ style, rotate = 0 }: { style?: React.CSSProperties; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 30 20"
      width="26"
      height="18"
      style={{ position: "absolute", transform: `rotate(${rotate}deg)`, opacity: 0.55, ...style }}
    >
      <path
        d="M2 10 Q 15 -2, 28 10 Q 15 22, 2 10 Z"
        fill="#a97a4a"
      />
      <path d="M2 10 L 28 10" stroke="#6d4c2a" strokeWidth="0.6" />
    </svg>
  );
}

function Sprig({ style, rotate = 0 }: { style?: React.CSSProperties; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width="34"
      height="34"
      style={{ position: "absolute", transform: `rotate(${rotate}deg)`, opacity: 0.6, ...style }}
    >
      <path d="M20 38 L 20 6" stroke="#5a7a3a" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="14" cy="22" rx="5" ry="3" fill="#7fa858" transform="rotate(-30 14 22)" />
      <ellipse cx="26" cy="16" rx="5" ry="3" fill="#8fbb62" transform="rotate(30 26 16)" />
      <ellipse cx="14" cy="12" rx="4" ry="2.5" fill="#7fa858" transform="rotate(-30 14 12)" />
    </svg>
  );
}

function Foliage({ style, pink = false }: { style?: React.CSSProperties; pink?: boolean }) {
  return (
    <svg
      viewBox="0 0 260 260"
      width="300"
      height="300"
      style={{ position: "absolute", opacity: 0.45, ...style }}
    >
      <g fill={pink ? "#f4b4c8" : "#6ea849"}>
        <circle cx="60" cy="60" r="40" />
        <circle cx="120" cy="40" r="30" opacity="0.85" />
        <circle cx="90" cy="110" r="34" opacity="0.9" />
        <circle cx="40" cy="140" r="28" opacity="0.75" />
        <circle cx="160" cy="90" r="22" opacity="0.7" />
      </g>
      {pink && (
        <g fill="#ffe4ec">
          <circle cx="80" cy="70" r="6" />
          <circle cx="130" cy="55" r="5" />
          <circle cx="60" cy="120" r="5" />
          <circle cx="150" cy="85" r="4" />
        </g>
      )}
    </svg>
  );
}

function Flower({ style, color }: { style?: React.CSSProperties; color: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      width="22"
      height="22"
      style={{ position: "absolute", opacity: 0.9, ...style }}
    >
      <g fill={color}>
        <circle cx="15" cy="8" r="4" />
        <circle cx="22" cy="15" r="4" />
        <circle cx="15" cy="22" r="4" />
        <circle cx="8" cy="15" r="4" />
      </g>
      <circle cx="15" cy="15" r="3" fill="#ffd166" />
    </svg>
  );
}
