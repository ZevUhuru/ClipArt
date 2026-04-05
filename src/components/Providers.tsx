"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { useAnimationQueue } from "@/stores/useAnimationQueue";
import { AuthModal } from "./AuthModal";
import { BuyCreditsModal } from "./BuyCreditsModal";
import { BuyCreditsModalSlot } from "./BuyCreditsModalSlot";
import type { RealtimeChannel } from "@supabase/supabase-js";

const useSlotModal = process.env.NEXT_PUBLIC_CREDITS_MODAL_VARIANT === "slot";

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setCredits, resetUserState } = useAppStore();
  const loadPending = useAnimationQueue((s) => s.loadPending);
  const stopPolling = useAnimationQueue((s) => s.stopPolling);
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

  const fetchPendingAnimations = useCallback(async () => {
    try {
      const res = await fetch("/api/me/animations/pending");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.jobs) && data.jobs.length > 0) {
          loadPending(data.jobs);
        }
      }
    } catch { /* ignore */ }
  }, [loadPending]);

  const subscribeToCredits = useCallback((supabase: ReturnType<typeof createBrowserClient>, userId: string) => {
    if (!supabase) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    try {
      const channel = supabase
        .channel(`credits:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload: { new?: { credits?: number } }) => {
            const newCredits = payload.new?.credits;
            if (typeof newCredits === "number") {
              setCredits(newCredits);
            }
          },
        )
        .subscribe();

      channelRef.current = channel;
    } catch {
      channelRef.current = null;
    }
  }, [setCredits]);

  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    async function loadSession() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();

      if (user) {
        setUser({ id: user.id, email: user.email ?? "" });
        await fetchCredits();
        subscribeToCredits(supabase, user.id);
        fetchPendingAnimations();
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
        await fetchCredits();
        subscribeToCredits(supabase, session.user.id);
        fetchPendingAnimations();
      } else {
        resetUserState();
        stopPolling();
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
  }, [setUser, setCredits, resetUserState, fetchCredits, subscribeToCredits, fetchPendingAnimations, stopPolling]);

  return (
    <>
      {children}
      <AuthModal />
      {useSlotModal ? <BuyCreditsModalSlot /> : <BuyCreditsModal />}
    </>
  );
}
