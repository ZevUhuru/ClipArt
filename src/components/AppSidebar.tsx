"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useSidebar } from "@/stores/useSidebar";
import { createBrowserClient } from "@/lib/supabase/client";
import { packReleaseLandingPath, usePackReleaseNotification } from "@/hooks/usePackReleaseNotification";

const toolItems = [
  {
    href: "/create",
    label: "Create",
    matchFn: (pathname: string) => pathname === "/create",
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    href: "/create/packs",
    label: "Pack Studio",
    adminOnly: true,
    matchFn: (pathname: string) =>
      pathname === "/create/packs" || pathname.startsWith("/create/packs?"),
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
];

const EXPLORE_PREFIXES = ["/search", "/templates"];

const browseItems = [
  {
    href: "/search",
    label: "Explore",
    matchFn: (pathname: string) =>
      EXPLORE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")),
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.56" />
      </svg>
    ),
  },
  {
    href: "/packs",
    label: "Packs",
    matchFn: (pathname: string) =>
      pathname === "/packs" || pathname.startsWith("/packs/"),
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    href: "/library",
    label: "Library",
    matchFn: (pathname: string) =>
      pathname === "/library" || pathname.startsWith("/library/"),
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
  },
];

function NavItem({
  href,
  label,
  icon,
  isActive,
  collapsed,
  showRelease,
  releaseTitle,
  releaseBadge,
  releaseHref,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  collapsed: boolean;
  showRelease?: boolean;
  releaseTitle?: string;
  releaseBadge?: string;
  releaseHref?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={releaseHref || href}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all ${
        isActive
          ? "bg-white/[0.12] text-white shadow-sm shadow-black/20"
          : "text-gray-400 hover:bg-white/[0.07] hover:text-gray-200"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      <span className={`relative shrink-0 ${showRelease ? "text-orange-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.65)]" : ""}`}>
        {icon}
        {showRelease && (
          <>
            <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-orange-400 ring-2 ring-[#1c1c27]" />
            <span className="absolute -right-1.5 -top-1.5 h-3 w-3 animate-ping rounded-full bg-orange-300/70" />
          </>
        )}
      </span>
      {showRelease && !collapsed && (
        <span className="absolute -top-3 left-7 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-xl shadow-pink-950/25 ring-1 ring-white/20">
          {releaseBadge || "New drop"}
        </span>
      )}
      {showRelease && collapsed && (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-pink-950/25 ring-1 ring-white/15">
          New
        </span>
      )}
      {showRelease && collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-orange-200/30 bg-[#fff7ed] px-3 py-2 text-left shadow-2xl shadow-orange-950/20 ring-1 ring-white/80 group-hover:block">
          <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-orange-200/30 bg-[#fff7ed]" />
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
            {releaseBadge || "New pack"}
          </span>
          <span className="mt-0.5 block text-xs font-black text-gray-950">
            {releaseTitle || "A new pack is live"}
          </span>
        </span>
      )}
      <span
        className={`whitespace-nowrap transition-all duration-200 ${
          collapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
        }`}
      >
        {label}
      </span>
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
          {label}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, credits, isAdmin, openAuthModal, openBuyCreditsModal, resetUserState } = useAppStore();
  const { collapsed, toggle, hydrate, setCollapsedSilently } = useSidebar();
  const { release, showPackRelease, dismissPackRelease } = usePackReleaseNotification();

  useEffect(() => {
    hydrate(pathname);
  }, [pathname, hydrate]);

  useEffect(() => {
    if (
      pathname === "/design-bundles" ||
      pathname === "/packs" ||
      pathname.startsWith("/packs/") ||
      pathname === "/create/packs"
    ) {
      setCollapsedSilently(true);
    }
  }, [pathname, setCollapsedSilently]);

  async function handleSignOut() {
    const supabase = createBrowserClient();
    if (supabase) await supabase.auth.signOut();
    resetUserState();
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen flex-col shadow-[4px_0_24px_rgba(0,0,0,0.3)] bg-[#1c1c27] transition-[width] duration-200 ease-in-out md:flex ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Logo + Toggle */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? "justify-center w-full" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-transparent.png"
            className="h-7 w-7 shrink-0"
            alt=""
          />
          {!collapsed && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/logo-white.svg"
              className="h-7"
              alt="clip.art"
            />
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/[0.08] hover:text-gray-300"
            aria-label="Collapse sidebar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center px-2 pb-1">
          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/[0.08] hover:text-gray-300"
            aria-label="Expand sidebar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Tools */}
      <nav className={`space-y-1 pt-2 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            Tools
          </p>
        )}
        {toolItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const matchFn = (item as { matchFn?: (p: string) => boolean }).matchFn;
          const isActive = matchFn
            ? matchFn(pathname)
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              collapsed={collapsed}
              showRelease={item.href === "/packs" && showPackRelease}
              releaseTitle={release?.title}
              releaseBadge={release?.badge_label}
              releaseHref={item.href === "/packs" && showPackRelease && release ? packReleaseLandingPath(release) : undefined}
              onClick={item.href === "/packs" ? dismissPackRelease : undefined}
            />
          );
        })}
      </nav>

      {/* Browse */}
      <nav className={`mt-6 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            Browse
          </p>
        )}
        {browseItems.map((item) => {
          const isActive = item.matchFn
            ? item.matchFn(pathname)
            : pathname === item.href;
          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              collapsed={collapsed}
              showRelease={item.href === "/packs" && showPackRelease}
              releaseTitle={release?.title}
              releaseBadge={release?.badge_label}
              releaseHref={item.href === "/packs" && showPackRelease && release ? packReleaseLandingPath(release) : undefined}
              onClick={item.href === "/packs" ? dismissPackRelease : undefined}
            />
          );
        })}
      </nav>

      {/* Get Credits CTA */}
      <div className={`pt-6 ${collapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={() => user ? openBuyCreditsModal() : openAuthModal("signup")}
          title={collapsed ? "Get Credits" : undefined}
          className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold text-gray-300 transition-all hover:bg-white/[0.08] hover:text-white ${
            collapsed ? "justify-center px-0" : "border border-white/[0.08] bg-white/[0.04]"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400">
            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </span>
          <span
            className={`whitespace-nowrap transition-all duration-200 ${
              collapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
            }`}
          >
            Get Credits
          </span>
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
              Get Credits
            </span>
          )}
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer: Credits & Auth */}
      <div className={`border-t border-white/[0.06] p-4 space-y-2 ${collapsed ? "px-2" : ""}`}>
        {user ? (
          <>
            <div className={`flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-4 py-3 ${collapsed ? "justify-center px-0" : ""}`}>
              <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span
                className={`text-[15px] font-bold text-white transition-all duration-200 ${
                  collapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
                }`}
              >
                {credits}
              </span>
              {!collapsed && (
                <span className="text-[15px] text-gray-500">
                  credit{credits !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Link
              href="/settings"
              title={collapsed ? "Settings" : undefined}
              className={`group relative flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-300 ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              {collapsed ? (
                <>
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
                    Settings
                  </span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </>
              )}
            </Link>
            <button
              onClick={handleSignOut}
              title={collapsed ? "Sign out" : undefined}
              className={`group relative w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-300 ${
                collapsed ? "px-0 text-center" : ""
              }`}
            >
              {collapsed ? (
                <>
                  <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
                    Sign out
                  </span>
                </>
              ) : (
                "Sign out"
              )}
            </button>
          </>
        ) : (
          <div className="space-y-2">
            {collapsed ? (
              <button
                onClick={() => openAuthModal("signup")}
                title="Sign up"
                className="group relative flex w-full justify-center rounded-xl bg-white py-3 transition-all hover:bg-gray-100 active:scale-[0.98]"
              >
                <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
                  Sign up
                </span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
