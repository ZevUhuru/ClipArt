"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { CreditBadge } from "./CreditBadge";

export function CategoryNav() {
  const { openAuthModal, openBuyCreditsModal, user, setUser, setCredits } =
    useAppStore();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setCredits(0);
  }

  return (
    <nav className="sticky top-0 z-40 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.codepen.io/9394943/color-logo-no-bg.svg"
            className="h-8 sm:h-10"
            alt="clip.art"
          />
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              user ? openBuyCreditsModal() : openAuthModal("signup")
            }
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-1.5 pr-4 text-sm font-semibold uppercase tracking-wider text-gray-700 transition-all hover:bg-gray-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
              <svg
                className="h-3.5 w-3.5 text-black"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Get Credits
          </button>

          {user ? (
            <>
              <CreditBadge />
              <Link
                href="/generator"
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Create
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      <div className="h-[2px] bg-brand-gradient" />
    </nav>
  );
}
