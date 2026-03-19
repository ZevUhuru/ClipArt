"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { CreditBadge } from "./CreditBadge";

export function Nav() {
  const { openAuthModal, openBuyCreditsModal, user, setUser, setCredits } = useAppStore();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setCredits(0);
  }

  return (
    <nav className="relative z-10 flex-shrink-0 border-b border-white/10 bg-[#111111]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            className="h-6 sm:h-8"
            alt="clip.art"
          />
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => user ? openBuyCreditsModal() : openAuthModal("signup")}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/20"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
              <svg className="h-3.5 w-3.5 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </span>
            Get Credits
          </button>

          {user ? (
            <>
              <Link
                href="/generator"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                Create
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/40 transition-colors hover:text-white/70"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
