"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
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
      className="block rounded-xl px-6 py-3 text-lg font-bold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950"
    >
      {children}
    </Link>
  );
}

export function CategoryNav() {
  const { openAuthModal, user, resetUserState } =
    useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const mobileMenuPortal = mounted
    ? createPortal(
        <AnimatePresence>
          {menuOpen && (
            <MobileMenuSheet
              onClose={close}
            />
          )}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <>
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#171720]/95 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center"
          aria-label="clip.art home"
          title="clip.art home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" className="h-6 sm:h-7" alt="clip.art" />
        </Link>

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
                className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-white/[0.06] py-1.5 pl-1.5 pr-4 text-xs font-black uppercase tracking-[0.16em] text-amber-100 shadow-inner shadow-white/5 transition-all hover:bg-white/[0.1]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
                  <BoltIcon className="h-3.5 w-3.5 text-black" />
                </span>
                Get Free Credits
              </button>
              <button
                onClick={() => openAuthModal("signin")}
                className="rounded-full border border-white/10 bg-white px-5 py-2 text-sm font-black text-gray-900 shadow-sm transition-all hover:-translate-y-px hover:bg-gray-100"
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
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 text-xs font-black uppercase tracking-wider text-gray-200 transition-all hover:bg-white/[0.12]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
                <BoltIcon className="h-3 w-3 text-black" />
              </span>
              <span className="hidden min-[400px]:inline">Get </span>Credits
            </button>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>
    </nav>
    {mobileMenuPortal}
    <div className="h-14 sm:h-16" aria-hidden="true" />
    </>
  );
}

function MobileMenuSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="lg:hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="fixed inset-x-0 bottom-0 z-[60] max-h-[84vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl shadow-black/30"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="sticky top-0 z-10 bg-white px-6 pt-2.5 pb-4">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="mt-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-500">
              Menu
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-col px-6 py-4">
          <div className="mt-3 space-y-3">
            <MenuLink href="/create" onClick={onClose}>Create</MenuLink>
            <MenuLink href="/search" onClick={onClose}>Browse</MenuLink>
            <MenuLink href="/learn" onClick={onClose}>Learn</MenuLink>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
