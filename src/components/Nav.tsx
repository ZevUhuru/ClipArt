"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function Nav() {
  const { openAuthModal, openBuyCreditsModal, user, credits, resetUserState } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen, close]);

  async function handleSignOut() {
    const supabase = createBrowserClient();
    if (supabase) await supabase.auth.signOut();
    resetUserState();
    close();
  }

  return (
    <nav className="relative z-10 flex-shrink-0 bg-[#111111]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:h-16 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" className="h-5 sm:h-8" alt="clip.art" />
        </Link>

        {/* ── Desktop nav (md+) ── */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href="/create"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                Create
              </Link>
              <Link
                href="/my-art"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                My Art
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/40 transition-colors hover:text-white/70"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthModal("signup")}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/20"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
                  <BoltIcon className="h-3.5 w-3.5 text-black" />
                </span>
                Get Credits
              </button>
              <button
                onClick={() => openAuthModal("signin")}
                className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* ── Mobile controls (below md) ── */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <button
              onClick={() => openAuthModal("signup")}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/20"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
                <BoltIcon className="h-3 w-3 text-black" />
              </span>
              <span className="hidden min-[400px]:inline">Get </span>Credits
            </button>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>

      {/* ── Mobile slide-over ── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-72 bg-[#111111] shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Panel header */}
          <div className="flex h-14 items-center justify-between px-4">
            <span className="text-sm font-semibold text-white/50">Menu</span>
            <button
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col px-4">
            {user ? (
              <>
                {/* Credit balance */}
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
                    <BoltIcon className="h-4 w-4 text-black" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{credits} credit{credits !== 1 ? "s" : ""}</p>
                    <button
                      onClick={() => { openBuyCreditsModal(); close(); }}
                      className="text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
                    >
                      Buy more
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <MenuLink href="/create" onClick={close}>Create Clip Art</MenuLink>
                  <MenuLink href="/create/coloring-pages" onClick={close}>Create Coloring Pages</MenuLink>
                  <MenuLink href="/my-art" onClick={close}>My Art</MenuLink>
                  <MenuLink href="/search" onClick={close}>Browse</MenuLink>
                  <MenuLink href="/learn" onClick={close}>Learn</MenuLink>
                </div>

                <div className="my-4 border-t border-white/10" />

                <button
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openAuthModal("signup"); close(); }}
                  className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-amber-300"
                >
                  <BoltIcon className="h-4 w-4" />
                  Get Free Credits
                </button>

                <button
                  onClick={() => { openAuthModal("signin"); close(); }}
                  className="mb-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/20"
                >
                  Sign in
                </button>

                <div className="my-1 border-t border-white/10" />

                <div className="mt-3 space-y-1">
                  <MenuLink href="/create" onClick={close}>Create</MenuLink>
                  <MenuLink href="/coloring-pages" onClick={close}>Coloring Pages</MenuLink>
                  <MenuLink href="/search" onClick={close}>Browse</MenuLink>
                  <MenuLink href="/learn" onClick={close}>Learn</MenuLink>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}
