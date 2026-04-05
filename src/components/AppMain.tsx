"use client";

import { useSidebar } from "@/stores/useSidebar";

export function AppMain({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebar((s) => s.collapsed);

  return (
    <main
      className={`mobile-main min-h-dvh bg-gray-100 rounded-l-2xl overflow-hidden shadow-[inset_3px_0_12px_rgba(0,0,0,0.06)] transition-[margin-left] duration-200 ease-in-out md:pb-0 ${
        collapsed ? "md:ml-[68px]" : "md:ml-60"
      }`}
    >
      {children}
    </main>
  );
}
