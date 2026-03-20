"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { AuthModal } from "./AuthModal";
import { BuyCreditsModal } from "./BuyCreditsModal";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setCredits } = useAppStore();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/me/credits");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.credits === "number") setCredits(data.credits);
      }
    } catch { /* ignore */ }
  }, [setCredits]);

  const subscribeToCredits = useCallback((supabase: ReturnType<typeof createBrowserClient>, userId: string) => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
    }

    const channel = supabase?.channel(`credits:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newCredits = payload.new?.credits;
          if (typeof newCredits === "number") {
            setCredits(newCredits);
          }
        },
      )
      .subscribe();

    channelRef.current = channel ?? null;
  }, [setCredits]);

  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser({ id: user.id, email: user.email! });
        await fetchCredits();
        subscribeToCredits(supabase, user.id);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        await fetchCredits();
        subscribeToCredits(supabase, session.user.id);
      } else {
        setUser(null);
        setCredits(0);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setUser, setCredits, fetchCredits, subscribeToCredits]);

  return (
    <>
      {children}
      <AuthModal />
      <BuyCreditsModal />
    </>
  );
}
