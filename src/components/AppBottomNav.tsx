"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

interface Tab {
  href: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  matchPrefixes?: string[];
}

const tabs: Tab[] = [
  {
    href: "/create",
    label: "Create",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    activeIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18 18 0 00-3.471 2.987 10.04 10.04 0 00-2.55 2.554 18.003 18.003 0 00-2.987 3.471l-3.385 5.08a1.902 1.902 0 002.532 2.533l5.08-3.385a18 18 0 003.471-2.988 10.04 10.04 0 002.554-2.55 18.003 18.003 0 002.987-3.471l3.386-5.08A1.902 1.902 0 0020.599 1.5zm-8.3 14.025a16.082 16.082 0 01-3.761 2.755c.034.706-.396 1.36-1.113 1.588a4.505 4.505 0 01-5.69-4.305c0-.09.003-.18.008-.27a16.1 16.1 0 012.755-3.761l.042-.042a10.04 10.04 0 00-.042 3.693 2.25 2.25 0 002.653 2.653 10.04 10.04 0 003.693-.042l.042-.042-.587-.269z" clipRule="evenodd" />
      </svg>
    ),
    matchPrefixes: ["/create"],
  },
  {
    href: "/search",
    label: "Explore",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    activeIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
      </svg>
    ),
    matchPrefixes: ["/search", "/templates"],
  },
  {
    href: "/design-bundles",
    label: "Packs",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    activeIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.998 2.25a3.376 3.376 0 00-3.27 4.219H4.5A2.25 2.25 0 002.25 8.72v1.5c0 .73.35 1.379.891 1.79v6.74A2.25 2.25 0 005.391 21h13.218a2.25 2.25 0 002.25-2.25v-6.74a2.247 2.247 0 00.891-1.79v-1.5a2.25 2.25 0 00-2.25-2.25h-4.227a3.376 3.376 0 00-3.275-4.219zm-1.875 3.375a1.875 1.875 0 113.75 0v.844h-3.75v-.844zM3.75 8.72a.75.75 0 01.75-.75h6.75v2.25h-7.5v-1.5zm9 1.5v-2.25h6.75a.75.75 0 01.75.75v1.5h-7.5zm-8.109 1.5h6.609v7.78H5.391a.75.75 0 01-.75-.75v-7.03zm8.109 7.78v-7.78h6.609v7.03a.75.75 0 01-.75.75H12.75z" clipRule="evenodd" />
      </svg>
    ),
    matchPrefixes: ["/design-bundles"],
  },
  {
    href: "/my-art",
    label: "My Art",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    activeIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zm19.5 0v.28l-2.72 2.72a2.25 2.25 0 01-3.182 0l-1.409-1.409a2.25 2.25 0 00-3.182 0L5.25 12.87V6h15.75zm0 12V9.69l-.97.97a3.75 3.75 0 01-5.303 0L13.318 9.25a.75.75 0 00-1.06 0L5.25 16.258V18h15.75z" clipRule="evenodd" />
      </svg>
    ),
    matchPrefixes: ["/my-art"],
  },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 overflow-hidden bg-[#1c1c27] px-4 pt-2 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
      aria-label="Primary navigation"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-0 h-24 w-28 rounded-full bg-pink-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-2 h-24 w-28 rounded-full bg-orange-300/15 blur-3xl"
      />
      <div className="relative flex h-14 items-center justify-around rounded-2xl bg-white/10 p-1 ring-1 ring-white/12 backdrop-blur">
        {tabs.map((tab) => {
          const isActive = tab.matchPrefixes
            ? tab.matchPrefixes.some((p) => pathname.startsWith(p))
            : pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-all ${
                isActive
                  ? "text-gray-950"
                  : "text-white/55 hover:bg-white/5 hover:text-white active:bg-white/10"
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-white shadow-sm" />
              )}
              <span className="relative">
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              <span className="relative text-[10px] font-bold">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
