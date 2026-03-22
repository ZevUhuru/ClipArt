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
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
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
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-white/[0.06] bg-[#1c1c27] md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-transparent.png"
            className="h-7 w-7 shrink-0"
            alt=""
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            className="h-7"
            alt="clip.art"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all ${
                isActive
                  ? "bg-white/[0.12] text-white shadow-sm shadow-black/20"
                  : "text-gray-400 hover:bg-white/[0.07] hover:text-gray-200"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Get Credits CTA */}
      <div className="px-3 pt-6">
        <button
          onClick={() => user ? openBuyCreditsModal() : openAuthModal("signup")}
          className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] font-semibold text-gray-300 transition-all hover:bg-white/[0.08] hover:text-white"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400">
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
      <div className="border-t border-white/[0.06] p-4 space-y-2">
        {user ? (
          <>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-4 py-3">
              <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-[15px] font-bold text-white">
                {credits}
              </span>
              <span className="text-[15px] text-gray-500">
                credit{credits !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-300"
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => openAuthModal("signin")}
              className="w-full rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-gray-400 transition-all hover:bg-white/[0.07] hover:text-white"
            >
              Log in
            </button>
            <button
              onClick={() => openAuthModal("signup")}
              className="w-full rounded-xl bg-white px-4 py-3 text-center text-[15px] font-bold text-gray-900 shadow-lg shadow-black/20 transition-all hover:bg-gray-100 active:scale-[0.98]"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
