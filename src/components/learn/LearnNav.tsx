"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export function LearnNav() {
  const pathname = usePathname();
  const { openAuthModal, openBuyCreditsModal, user } = useAppStore();

  const links = [
    { href: "/learn", label: "Learn" },
    { href: "/create", label: "Create" },
    { href: "/coloring-pages", label: "Coloring Pages" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#1c1c27] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.svg" className="h-5 sm:h-7" alt="clip.art" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const isActive =
                link.href === "/learn"
                  ? pathname.startsWith("/learn")
                  : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <button
          onClick={() =>
            user ? openBuyCreditsModal() : openAuthModal("signup")
          }
          className="rounded-full bg-brand-gradient px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 sm:px-5 sm:py-2 sm:text-sm"
        >
          Try Free
        </button>
      </div>
    </nav>
  );
}
