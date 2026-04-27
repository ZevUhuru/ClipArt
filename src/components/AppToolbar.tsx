"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  key: string;
  label: string;
  items: MenuItem[];
  isActive: (pathname: string) => boolean;
}

const ClipArtIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);

const IllustrationIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
);

const ColoringIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    <circle cx="17" cy="17" r="3" strokeLinecap="round" />
  </svg>
);

const WorksheetIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const BundleIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const ExploreIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.56" />
  </svg>
);

const LibraryIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
);

const AnimateIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
  </svg>
);

const StoryboardIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const MENU_GROUPS: MenuGroup[] = [
  {
    key: "create",
    label: "Create",
    isActive: (p) => p.startsWith("/create"),
    items: [
      { href: "/create", label: "Clip Art", description: "Flat, cartoon, watercolor and more", icon: <ClipArtIcon /> },
      { href: "/create/illustrations", label: "Illustrations", description: "Full-scene artwork with backgrounds", icon: <IllustrationIcon /> },
      { href: "/create/coloring-pages", label: "Coloring Pages", description: "Printable line art for any theme", icon: <ColoringIcon /> },
      { href: "/create/worksheets", label: "Worksheets", description: "Educational printables by grade", icon: <WorksheetIcon /> },
      { href: "/create/packs", label: "Theme Packs", description: "Curate a themed collection", icon: <BundleIcon /> },
    ],
  },
  {
    key: "browse",
    label: "Browse",
    isActive: (p) => ["/search", "/library", "/design-bundles"].some((prefix) => p === prefix || p.startsWith(prefix + "/")),
    items: [
      { href: "/search", label: "Explore", description: "Discover community creations", icon: <ExploreIcon /> },
      { href: "/library", label: "Library", description: "Your saved and generated art", icon: <LibraryIcon /> },
      { href: "/design-bundles", label: "Theme Packs", description: "Download themed collections", icon: <BundleIcon /> },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    isActive: (p) => p.startsWith("/animate") || p.startsWith("/storyboard"),
    items: [
      { href: "/animate", label: "Animate", description: "Bring your clip art to life", icon: <AnimateIcon /> },
      { href: "/storyboard", label: "Storyboard", description: "Sequence animated scenes", icon: <StoryboardIcon /> },
    ],
  },
];

function DropdownMenu({
  group,
  isOpen,
  onToggle,
  onClose,
  pathname,
}: {
  group: MenuGroup;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  pathname: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const groupActive = group.isActive(pathname);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`group flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          groupActive
            ? "text-gray-900"
            : "text-gray-500 hover:text-gray-800"
        } ${isOpen ? "bg-gray-100" : "hover:bg-gray-50"}`}
      >
        {group.label}
        {/* Active dot */}
        {groupActive && !isOpen && (
          <span className="ml-0.5 h-1 w-1 rounded-full bg-pink-500" />
        )}
        <svg
          className={`h-3 w-3 text-gray-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/40"
          >
            {group.items.map((item) => {
              const isItemActive =
                item.href === "/create"
                  ? pathname === "/create"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isItemActive
                      ? "bg-gray-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`mt-0.5 ${isItemActive ? "text-pink-500" : "text-gray-400"}`}>
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold leading-tight ${isItemActive ? "text-pink-600" : "text-gray-800"}`}>
                      {item.label}
                      {isItemActive && (
                        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-pink-400 align-middle" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-tight text-gray-400">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppToolbar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggle = useCallback((key: string) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  }, []);

  const close = useCallback(() => setOpenMenu(null), []);

  // Close on route change
  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  return (
    <div className="flex items-center gap-0.5">
      {MENU_GROUPS.map((group) => (
        <DropdownMenu
          key={group.key}
          group={group}
          isOpen={openMenu === group.key}
          onToggle={() => toggle(group.key)}
          onClose={close}
          pathname={pathname}
        />
      ))}
    </div>
  );
}
