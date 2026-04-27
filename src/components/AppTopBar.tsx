"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppToolbar } from "./AppToolbar";

/** Routes where the toolbar is already embedded by the page itself. */
const HIDDEN_PREFIXES = ["/create"];

interface NavItem {
  href: string;
  label: string;
  description: string;
  match: (pathname: string) => boolean;
}

const MENU_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Create",
    items: [
      {
        href: "/create",
        label: "Clip Art Generator",
        description: "Create transparent clip art",
        match: (p) => p === "/create",
      },
      {
        href: "/create/illustrations",
        label: "Illustrations",
        description: "Full-scene artwork with backgrounds",
        match: (p) => p.startsWith("/create/illustrations"),
      },
      {
        href: "/create/coloring-pages",
        label: "Coloring Pages",
        description: "Printable line art",
        match: (p) => p.startsWith("/create/coloring-pages"),
      },
      {
        href: "/create/worksheets",
        label: "Worksheets",
        description: "Educational printables",
        match: (p) => p.startsWith("/create/worksheets"),
      },
    ],
  },
  {
    label: "Browse",
    items: [
      {
        href: "/search",
        label: "Explore",
        description: "Discover community creations",
        match: (p) => p === "/search" || p.startsWith("/search/") || p.startsWith("/templates"),
      },
      {
        href: "/library",
        label: "Library",
        description: "Your saved and generated art",
        match: (p) => p === "/library" || p.startsWith("/library/"),
      },
      {
        href: "/my-art",
        label: "My Art",
        description: "Your personal gallery",
        match: (p) => p === "/my-art" || p.startsWith("/my-art/"),
      },
      {
        href: "/design-bundles",
        label: "Theme Packs",
        description: "Download themed collections",
        match: (p) => p === "/design-bundles" || p.startsWith("/design-bundles/"),
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        href: "/animate",
        label: "Animate",
        description: "Bring your art to life",
        match: (p) => p === "/animate" || p.startsWith("/animate/"),
      },
      {
        href: "/storyboard",
        label: "Storyboard",
        description: "Sequence animated scenes",
        match: (p) => p === "/storyboard" || p.startsWith("/storyboard/"),
      },
      {
        href: "/shorts",
        label: "Shorts",
        description: "Manage short videos",
        match: (p) => p === "/shorts" || p.startsWith("/shorts/"),
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        href: "/settings",
        label: "Settings",
        description: "Account and preferences",
        match: (p) => p === "/settings" || p.startsWith("/settings/"),
      },
    ],
  },
];

function pageMeta(pathname: string) {
  if (pathname.startsWith("/search") || pathname.startsWith("/templates")) {
    return { eyebrow: "Browse", title: "Explore" };
  }
  if (pathname.startsWith("/library")) return { eyebrow: "Saved", title: "Library" };
  if (pathname.startsWith("/my-art")) return { eyebrow: "Saved", title: "My Art" };
  if (pathname.startsWith("/design-bundles")) return { eyebrow: "Collections", title: "Theme Packs" };
  if (pathname.startsWith("/animate")) return { eyebrow: "Tools", title: "Animate" };
  if (pathname.startsWith("/storyboard")) return { eyebrow: "Tools", title: "Storyboard" };
  if (pathname.startsWith("/shorts")) return { eyebrow: "Tools", title: "Shorts" };
  if (pathname.startsWith("/settings")) return { eyebrow: "Account", title: "Settings" };
  if (pathname.startsWith("/edit")) return { eyebrow: "Editor", title: "Edit" };
  return { eyebrow: "App", title: "clip.art" };
}

export function AppTopBar() {
  const pathname = usePathname() ?? "/";
  const customMobileHeader =
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname.startsWith("/templates") ||
    pathname === "/library" ||
    pathname.startsWith("/library/") ||
    pathname === "/my-art" ||
    pathname.startsWith("/my-art/");

  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (hidden) return null;

  if (customMobileHeader) {
    return (
      <div className="hidden sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-xl md:block">
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="flex h-10 items-center">
            <AppToolbar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 border-b border-gray-900/10 bg-[#1c1c27] shadow-xl shadow-gray-900/10 md:z-30 md:border-gray-100 md:bg-white/80 md:shadow-none md:backdrop-blur-xl">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="md:hidden">
          <MobileAppHeader pathname={pathname} />
        </div>
        <div className="hidden h-10 items-center md:flex">
          <AppToolbar />
        </div>
      </div>
    </div>
  );
}

function MobileAppHeader({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = pageMeta(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

  return (
    <div className="relative -mx-4 overflow-hidden px-4 py-3 text-white">
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
            {meta.eyebrow}
          </p>
          <div className="truncate font-futura text-[22px] font-black leading-tight tracking-tight text-white">
            {meta.title}
          </div>
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
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenuSheet pathname={pathname} onClose={() => setMenuOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenuSheet({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose: () => void;
}) {
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

        {MENU_SECTIONS.map((section) => (
          <div key={section.label} className="px-5 pb-4">
            <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {section.label}
            </h2>
            <div className="mt-2 flex flex-col gap-1">
              {section.items.map((item) => (
                <SheetLink
                  key={item.href}
                  item={item}
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
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick: () => void;
}) {
  const isActive = item.match(pathname);

  return (
    <Link
      href={item.href}
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
        <p className={`text-[15px] font-semibold leading-tight ${isActive ? "text-pink-600" : "text-gray-900"}`}>
          {item.label}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-gray-500">
          {item.description}
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
