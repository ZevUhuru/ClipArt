"use client";

import { ReactNode, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { AuthModal } from "./AuthModal";
import { BuyCreditsModal } from "./BuyCreditsModal";

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setCredits } = useAppStore();

  useEffect(() => {
    const client = createBrowserClient();
    if (!client) return;

    const supabase = client;

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser({ id: user.id, email: user.email! });

        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        if (profile) {
          setCredits(profile.credits);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });

        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setCredits(profile.credits);
        }
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setCredits]);

  return (
    <>
      {children}
      <AuthModal />
      <BuyCreditsModal />
    </>
  );
}
