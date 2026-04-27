"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContentType {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

const CONTENT_TYPES: ContentType[] = [
  { href: "/create", label: "Clip Art", match: (p) => p === "/create" },
  {
    href: "/create/illustrations",
    label: "Illustrations",
    match: (p) => p.startsWith("/create/illustrations"),
  },
  {
    href: "/create/coloring-pages",
    label: "Coloring",
    match: (p) => p.startsWith("/create/coloring-pages"),
  },
  {
    href: "/create/worksheets",
    label: "Worksheets",
    match: (p) => p.startsWith("/create/worksheets"),
  },
  {
    href: "/create/packs",
    label: "Packs",
    match: (p) => p.startsWith("/create/packs"),
  },
];

interface SheetLinkData {
  href: string;
  label: string;
  description: string;
}

interface SheetSection {
  label: string;
  items: SheetLinkData[];
}

// Overflow destinations — what's NOT already in row-2 tabs or the bottom nav.
// Browse/Tools mirror the desktop AppToolbar grouping for a familiar mental model.
const SHEET_SECTIONS: SheetSection[] = [
  {
    label: "Browse",
    items: [
      { href: "/search", label: "Explore", description: "Discover community creations" },
      { href: "/library", label: "Library", description: "Your saved and generated art" },
      { href: "/design-bundles", label: "Theme Packs", description: "Download themed collections" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/animate", label: "Animate", description: "Bring your clip art to life" },
      { href: "/storyboard", label: "Storyboard", description: "Sequence animated scenes" },
    ],
  },
];

/**
 * Mobile header for /create routes.
 *
 * This is intentionally not the desktop toolbar squeezed down. Mobile gets a
 * branded "studio" surface: icon-only brand mark, clear Create context, one
 * large menu action, and roomy content-type tabs embedded in the header.
 */
export function CreateMobileHeader() {
  const pathname = usePathname() ?? "/create";
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on route change so back-nav doesn't leave a dangling sheet.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

  return (
    <div className="relative -mx-4 overflow-hidden px-4 pt-3 pb-3 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 h-36 w-36 rounded-full bg-pink-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 top-4 h-32 w-32 rounded-full bg-orange-300/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10"
      />

      {/* Row 1 — immersive brand context + menu */}
      <div className="relative flex min-h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur"
          aria-label="clip.art home"
          title="clip.art home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-transparent.png" alt="" className="h-7 w-7" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            Studio
          </p>
          <h1 className="truncate text-[22px] font-black leading-tight tracking-tight text-white">
            Create
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className={`relative z-[120] flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 backdrop-blur transition-colors ${
            menuOpen
              ? "bg-white text-gray-950 ring-white shadow-lg shadow-black/20"
              : "bg-white/10 text-white ring-white/15 hover:bg-white/15 active:bg-white/20"
          }`}
        >
          {menuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.25}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Row 2 — integrated content-type rail with large thumb targets. */}
      <div className="relative mt-3 rounded-2xl bg-white/10 p-1 ring-1 ring-white/12 backdrop-blur">
        <div
          className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Content type"
        >
          {CONTENT_TYPES.map((type) => {
            const isActive = type.match(pathname);
            return (
              <Link
                key={type.href}
                href={type.href}
                role="tab"
                aria-selected={isActive}
                className={`relative flex h-11 shrink-0 items-center rounded-xl px-4 text-[14px] font-bold transition-colors ${
                  isActive ? "text-gray-950" : "text-white/70 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="create-tab-pill"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">
                  {type.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-1 right-1 w-10 rounded-r-2xl bg-gradient-to-l from-[#1c1c27] to-transparent"
        />
      </div>

      {/* Slide-up menu sheet */}
      <AnimatePresence>
        {menuOpen && (
          <MenuSheet pathname={pathname} onClose={() => setMenuOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuSheet({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose: () => void;
}) {
  // Close on Escape — keeps it accessible.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="fixed inset-x-0 bottom-0 z-[100] max-h-[82vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl shadow-black/30"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="sticky top-0 z-10 bg-white px-5 pt-2.5 pb-4">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Navigation
              </p>
              <h2 className="mt-0.5 text-2xl font-black tracking-tight text-gray-950">
                More places
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {SHEET_SECTIONS.map((section) => (
          <div key={section.label} className="px-5 pb-4">
            <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {section.label}
            </h2>
            <div className="mt-2 flex flex-col gap-1">
              {section.items.map((item) => (
                <SheetLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  description={item.description}
                  pathname={pathname}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </>
  );
}

function SheetLink({
  href,
  label,
  description,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  description: string;
  pathname: string;
  onClick: () => void;
}) {
  const isActive =
    href === "/create" ? pathname === "/create" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 transition-all ${
        isActive
          ? "border-pink-100 bg-pink-50 shadow-sm shadow-pink-100/60"
          : "border-gray-100 bg-gray-50/80 hover:border-gray-200 hover:bg-white hover:shadow-sm active:bg-gray-100"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isActive ? "bg-white text-pink-500" : "bg-white text-gray-500"
        }`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[15px] font-semibold leading-tight ${
            isActive ? "text-pink-600" : "text-gray-900"
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-gray-500">
          {description}
        </p>
      </div>
      <span
        className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
          isActive ? "bg-pink-500" : "bg-gray-200 group-hover:bg-gray-300"
        }`}
      />
    </Link>
  );
}
