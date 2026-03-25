"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";

function CreditBadgeInline() {
  const { credits } = useAppStore();
  return <>{credits} credit{credits !== 1 ? "s" : ""}</>;
}

export function Nav() {
  const { openAuthModal, openBuyCreditsModal, user, resetUserState } = useAppStore();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    if (supabase) await supabase.auth.signOut();
    resetUserState();
  }

  return (
    <nav className="relative z-10 flex-shrink-0 bg-[#111111]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:h-16 sm:px-4">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            className="h-5 sm:h-8"
            alt="clip.art"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => user ? openBuyCreditsModal() : openAuthModal("signup")}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/20 sm:gap-2 sm:pr-4 sm:text-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 sm:h-7 sm:w-7">
              <svg className="h-3 w-3 text-black sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="hidden min-[400px]:inline">Get </span>Credits
          </button>

          {user ? (
            <>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white sm:px-3 sm:text-sm">
                <CreditBadgeInline />
              </span>
              <Link
                href="/create"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
              >
                Create
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full px-2 py-1.5 text-xs font-medium text-white/40 transition-colors hover:text-white/70 sm:px-4 sm:py-2 sm:text-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:px-5 sm:py-2 sm:text-sm"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
