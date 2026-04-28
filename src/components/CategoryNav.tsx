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

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-gray-200 hover:bg-white hover:text-pink-600"
    >
      {children}
    </Link>
  );
}

export function CategoryNav() {
  const { openAuthModal, openBuyCreditsModal, user, credits, resetUserState } =
    useAppStore();
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
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#171720]/95 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center"
          aria-label="clip.art home"
          title="clip.art home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" className="h-7 sm:h-8" alt="clip.art" />
        </Link>

        {/* ── Desktop nav (lg+) ── */}
        <div className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
          {user ? (
            <>
              <Link
                href="/create"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Create
              </Link>
              <Link
                href="/search"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Explore
              </Link>
              <Link
                href="/design-bundles"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Theme Packs
              </Link>
              <Link
                href="/my-art"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Library
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/create"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Create
              </Link>
              <Link
                href="/coloring-pages"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Coloring Pages
              </Link>
              <Link
                href="/search"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Explore
              </Link>
              <Link
                href="/design-bundles"
                className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Theme Packs
              </Link>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-300"
            >
              Sign out
            </button>
          ) : (
            <>
              <button
                onClick={() => openAuthModal("signup")}
                className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-white/[0.06] py-1.5 pl-1.5 pr-4 text-xs font-black uppercase tracking-[0.16em] text-amber-100 transition-all hover:bg-white/[0.1]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
                  <BoltIcon className="h-3.5 w-3.5 text-black" />
                </span>
                Get Free Credits
              </button>
              <button
                onClick={() => openAuthModal("signin")}
                className="rounded-full border border-white/10 bg-white px-5 py-2 text-sm font-black text-gray-900 shadow-sm transition-all hover:bg-gray-100"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* ── Mobile/tablet controls (below lg) ── */}
        <div className="flex items-center gap-2 lg:hidden">
          {!user && (
            <button
              onClick={() => openAuthModal("signup")}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 text-xs font-semibold uppercase tracking-wider text-gray-200 transition-all hover:bg-white/[0.12]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
                <BoltIcon className="h-3 w-3 text-black" />
              </span>
              <span className="hidden min-[400px]:inline">Get </span>Credits
            </button>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>

      {/* ── Mobile bottom sheet ── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

        <div
          className={`absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl shadow-black/30 transition-transform duration-300 ease-out ${menuOpen ? "translate-y-0" : "translate-y-full"}`}
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                clip.art
              </p>
              <h2 className="font-futura text-2xl font-black tracking-tight text-gray-950">
                Menu
              </h2>
            </div>
            <button
              onClick={close}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col px-5 py-4">
            {user ? (
              <>
                <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
                    <BoltIcon className="h-4 w-4 text-black" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-gray-950">{credits} credit{credits !== 1 ? "s" : ""}</p>
                    <button
                      onClick={() => { openBuyCreditsModal(); close(); }}
                      className="text-xs font-bold text-amber-600 transition-colors hover:text-amber-700"
                    >
                      Buy more
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <MenuLink href="/create" onClick={close}>Create Clip Art</MenuLink>
                  <MenuLink href="/create/coloring-pages" onClick={close}>Create Coloring Pages</MenuLink>
                  <MenuLink href="/create/worksheets" onClick={close}>Create Worksheets</MenuLink>
                  <MenuLink href="/design-bundles" onClick={close}>Theme Packs</MenuLink>
                  <MenuLink href="/my-art" onClick={close}>My Art</MenuLink>
                </div>

                <div className="my-4 border-t border-gray-100" />

                <p className="px-1 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Browse</p>
                <div className="space-y-1.5">
                  <MenuLink href="/search" onClick={close}>All Clip Art</MenuLink>
                  <MenuLink href="/coloring-pages" onClick={close}>Coloring Pages</MenuLink>
                  <MenuLink href="/worksheets" onClick={close}>Worksheets</MenuLink>
                  <MenuLink href="/design-bundles" onClick={close}>Theme Packs</MenuLink>
                  <MenuLink href="/learn" onClick={close}>Learn</MenuLink>
                </div>

                <div className="my-4 border-t border-gray-100" />

                <button
                  onClick={handleSignOut}
                  className="rounded-2xl px-3 py-3 text-left text-sm font-bold text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openAuthModal("signup"); close(); }}
                  className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-amber-300"
                >
                  <BoltIcon className="h-4 w-4" />
                  Get Free Credits
                </button>

                <button
                  onClick={() => { openAuthModal("signin"); close(); }}
                  className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-900 shadow-sm transition-all hover:bg-gray-50"
                >
                  Sign in
                </button>

                <div className="my-1 border-t border-gray-100" />

                <div className="mt-3 space-y-1.5">
                  <MenuLink href="/create" onClick={close}>Create</MenuLink>
                  <MenuLink href="/coloring-pages" onClick={close}>Coloring Pages</MenuLink>
                  <MenuLink href="/worksheets" onClick={close}>Worksheets</MenuLink>
                  <MenuLink href="/search" onClick={close}>Browse</MenuLink>
                  <MenuLink href="/design-bundles" onClick={close}>Theme Packs</MenuLink>
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
