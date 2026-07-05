import { Link, useLocation } from "@tanstack/react-router";
import { Leaf, Trophy, PenLine, BarChart3, User } from "lucide-react";
import { useForestData } from "@/hooks/use-forest";
import { tierFromScore, tierLabel } from "@/lib/forest-theme";
import { ThemeDecorations } from "@/components/ThemeDecorations";

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const { health } = useForestData();
  const tier = tierFromScore(health?.score ?? 100);

  const nav = [
    { to: "/app", label: "Forest", icon: Leaf },
    { to: "/log", label: "Log day", icon: PenLine },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/history", label: "History", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div
      data-forest-theme={tier}
      className="relative min-h-screen"
      style={{ background: "var(--canvas)" }}
    >
      <ThemeDecorations tier={tier} />
      <div className="relative z-10">

      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--canvas) 78%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/app" className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-2xl"
              style={{ background: "linear-gradient(180deg, var(--fern-glow), var(--fern))", boxShadow: "var(--shadow-leaf)" }}
            >
              <Leaf className="h-5 w-5" style={{ color: "white" }} />
            </div>
            <span className="display text-lg" style={{ color: "var(--delft-deep)" }}>
              Carbon Forest
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = loc.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: active ? "color-mix(in oklab, var(--pistachio) 50%, var(--canvas))" : "transparent",
                    color: active ? "var(--fern-shade)" : "var(--ink-soft)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Mobile bottom nav */}
        <nav className="md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-around gap-1 px-2 pb-2">
            {nav.map((n) => {
              const active = loc.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold"
                  style={{
                    background: active ? "color-mix(in oklab, var(--pistachio) 45%, var(--canvas))" : "transparent",
                    color: active ? "var(--fern-shade)" : "var(--ink-soft)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        {children}
        <div className="pointer-events-none fixed bottom-3 right-3 z-20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "color-mix(in oklab, var(--paper) 85%, transparent)", color: "var(--fern-shade)", border: "1px solid var(--border)" }}>
          {tierLabel(tier)}
        </div>
      </main>
      </div>
    </div>
  );
}

