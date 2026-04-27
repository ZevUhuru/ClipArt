"use client";

import { usePathname } from "next/navigation";
import { AppToolbar } from "./AppToolbar";

/** Routes where the toolbar is already embedded (CreatePageLayout) or unwanted (full-screen tools) */
const HIDDEN_PREFIXES = ["/create", "/animate", "/storyboard"];

export function AppTopBar() {
  const pathname = usePathname();

  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (hidden) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-10 items-center">
          <AppToolbar />
        </div>
      </div>
    </div>
  );
}
