"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modes = [
  { href: "/create", label: "Clip Art" },
  { href: "/create/illustrations", label: "Illustrations" },
  { href: "/create/coloring-pages", label: "Coloring Pages" },
];

export function CreateModeToggle() {
  const pathname = usePathname();

  return (
    <div className="mb-4 inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
      {modes.map((mode) => {
        const isActive =
          mode.href === "/create"
            ? pathname === "/create"
            : pathname.startsWith(mode.href);

        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {mode.label}
          </Link>
        );
      })}
    </div>
  );
}
