"use client";

import { useSidebar } from "@/stores/useSidebar";

export function AppMain({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebar((s) => s.collapsed);

  return (
    <main
      className={`min-h-screen pb-20 transition-[margin-left] duration-200 ease-in-out md:pb-0 ${
        collapsed ? "md:ml-[68px]" : "md:ml-60"
      }`}
    >
      {children}
    </main>
  );
}
