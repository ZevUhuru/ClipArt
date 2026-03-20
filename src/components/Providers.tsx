"use client";

import { ReactNode, useCallback, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { AuthModal } from "./AuthModal";
import { BuyCreditsModal } from "./BuyCreditsModal";

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setCredits } = useAppStore();

  const refreshCredits = useCallback(async (userId: string) => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profile) {
      setCredits(profile.credits);
    }
  }, [setCredits]);

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
        await refreshCredits(user.id);

        // After Stripe checkout redirect, the webhook may take a moment to process.
        // Poll for updated credits so the UI reflects the purchase.
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "true") {
          let attempts = 0;
          const poll = setInterval(async () => {
            attempts++;
            await refreshCredits(user.id);
            if (attempts >= 5) clearInterval(poll);
          }, 2000);

          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        await refreshCredits(session.user.id);
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setCredits, refreshCredits]);

  return (
    <>
      {children}
      <AuthModal />
      <BuyCreditsModal />
    </>
  );
}
