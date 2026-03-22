"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";

const navItems = [
  {
    href: "/create",
    label: "Create",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    href: "/my-art",
    label: "My Clip Art",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, credits, openAuthModal, openBuyCreditsModal, resetUserState } = useAppStore();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    if (supabase) await supabase.auth.signOut();
    resetUserState();
  }

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-gray-200 bg-white md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.codepen.io/9394943/color-logo-no-bg.svg"
            className="h-7"
            alt="clip.art"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-0.5 px-3 pt-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Get Credits CTA */}
      <div className="px-3 pt-5">
        <button
          onClick={() => user ? openBuyCreditsModal() : openAuthModal("signup")}
          className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 hover:shadow-sm"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </span>
          Get Credits
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer: Credits & Auth */}
      <div className="border-t border-gray-100 p-4 space-y-2">
        {user ? (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {credits}
              </span>
              <span className="text-sm text-gray-400">
                credit{credits !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="space-y-1.5">
            <button
              onClick={() => openAuthModal("signin")}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              Log in
            </button>
            <button
              onClick={() => openAuthModal("signup")}
              className="w-full rounded-lg bg-gray-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-gray-800"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
