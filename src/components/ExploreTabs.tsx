"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/search", label: "Search" },
  { href: "/packs", label: "Packs", matchPrefix: true },
  { href: "/templates", label: "Templates" },
];

export function ExploreTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = tab.matchPrefix
          ? pathname === tab.href || pathname.startsWith(tab.href + "/")
          : pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
