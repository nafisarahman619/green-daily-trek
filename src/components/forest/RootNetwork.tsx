import { rootDensityLevel } from "@/hooks/use-lifetime-saved";

interface RootNetworkProps {
  lifetimeCO2Saved: number;
}

/**
 * An independent underground "root / mycelium" visualization.
 * Purely additive — not tied to any tree above.
 */
export function RootNetwork({ lifetimeCO2Saved }: RootNetworkProps) {
  const level = rootDensityLevel(lifetimeCO2Saved);

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.22 0.05 40) 0%, oklch(0.15 0.05 40) 55%, oklch(0.10 0.04 40) 100%)",
        aspectRatio: "16 / 6",
        boxShadow: "inset 0 8px 24px oklch(0 0 0 / 0.5), 0 8px 24px oklch(0 0 0 / 0.15)",
      }}
      aria-label="Underground root network"
    >
      <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="rootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a86b3c" />
            <stop offset="100%" stopColor="#5c3a1e" />
          </linearGradient>
        </defs>
        {/* Main root 1 */}
        <path
          d="M180,0
             C170,30 165,55 150,80
             C140,95 120,105 95,115
             C130,108 148,100 158,84
             C168,60 172,32 186,0 Z"
          fill="url(#rootGrad)"
        />
        {/* Branch off main root 1 */}
        <path
          d="M150,80
             C130,95 100,100 60,130
             C95,112 125,105 145,90 Z"
          fill="#7a4d28"
          opacity="0.9"
        />
        {/* Main root 2 */}
        <path
          d="M220,0
             C232,35 245,60 270,90
             C285,108 310,118 340,125
             C305,115 280,102 262,84
             C242,58 228,30 214,0 Z"
          fill="url(#rootGrad)"
        />
        {/* Branch off main root 2 */}
        <path
          d="M262,84
             C280,100 305,105 335,120
             C300,108 275,98 255,90 Z"
          fill="#7a4d28"
          opacity="0.9"
        />
        {/* Center thin root */}
        <path
          d="M200,0
             C198,50 202,90 198,140
             C196,165 204,185 200,210
             C210,185 206,160 208,135
             C210,90 205,50 206,0 Z"
          fill="url(#rootGrad)"
          opacity="0.95"
        />
        {/* Small fine root hairs for texture */}
        <path d="M158,84 Q145,92 130,88" stroke="#5c3a1e" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M262,84 Q275,90 288,86" stroke="#5c3a1e" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M198,140 Q188,148 178,144" stroke="#5c3a1e" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>

      {level === 0 && (
        <div
          className="absolute inset-0 grid place-items-center px-6 text-center text-xs"
          style={{ color: "oklch(0.75 0.05 80)" }}
        >
          Log low-emission trips to begin weaving your root network.
        </div>
      )}
    </div>
  );
}
