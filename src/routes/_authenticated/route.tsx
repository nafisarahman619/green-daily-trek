import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // TEMP DEBUG: check local session first (reads localStorage, no network)
    const sessionResult = await supabase.auth.getSession();
    console.log("[auth-guard] getSession() ->", {
      hasSession: !!sessionResult.data.session,
      userId: sessionResult.data.session?.user?.id,
      expiresAt: sessionResult.data.session?.expires_at,
      error: sessionResult.error,
    });

    if (sessionResult.error) {
      console.error("[auth-guard] getSession() error (full):", sessionResult.error);
    }

    // Prefer local session for the guard — resilient to network hiccups.
    // Token auto-refreshes in the background via the Supabase client.
    if (sessionResult.data.session) {
      return { user: sessionResult.data.session.user };
    }

    // No local session — try one server-side check before redirecting, and log why.
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("[auth-guard] getUser() failed (full error):", error, {
        name: (error as any)?.name,
        status: (error as any)?.status,
        message: error.message,
      });
    }
    if (error || !data.user) {
      console.warn("[auth-guard] No session and no user — redirecting to /auth");
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
