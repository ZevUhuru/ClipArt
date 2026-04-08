"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const modes = [
  { href: "/create", label: "Clip Art", key: "clipart" },
  { href: "/create/illustrations", label: "Illustrations", key: "illustrations" },
  { href: "/create/coloring-pages", label: "Coloring Pages", key: "coloring" },
  { href: "/create/packs", label: "Bundles", key: "packs" },
];

export function CreateModeToggle() {
  const pathname = usePathname();

  return (
    <div className="mb-4 inline-flex items-center gap-1 rounded-xl bg-gray-100/80 p-1">
      {modes.map((mode) => {
        const isActive =
          mode.href === "/create"
            ? pathname === "/create"
            : pathname.startsWith(mode.href);

        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="create-mode-indicator"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{mode.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
