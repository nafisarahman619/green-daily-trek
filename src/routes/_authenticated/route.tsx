import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Read session from localStorage first — resilient to network hiccups.
    // The Supabase client auto-refreshes the token in the background.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      return { user: sessionData.session.user };
    }

    // No local session — try one server-side check before redirecting.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
