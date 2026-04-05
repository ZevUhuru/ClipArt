"use client";

import { useSidebar } from "@/stores/useSidebar";

function CornerOverlay({ position }: { position: "top" | "bottom" }) {
  const collapsed = useSidebar((s) => s.collapsed);
  const posClass = position === "top" ? "top-0" : "bottom-0";
  const radiusClass = position === "top" ? "rounded-tl-[16px]" : "rounded-bl-[16px]";

  return (
    <div
      className={`fixed ${posClass} z-[25] hidden h-4 w-4 bg-[#1c1c27] md:block transition-[left] duration-200 ease-in-out ${
        collapsed ? "left-[68px]" : "left-60"
      }`}
      aria-hidden="true"
    >
      <div className={`h-full w-full ${radiusClass} bg-gray-100`} />
    </div>
  );
}

export function AppMain({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebar((s) => s.collapsed);

  return (
    <>
      <CornerOverlay position="top" />
      <CornerOverlay position="bottom" />
      <main
        className={`mobile-main min-h-dvh bg-gray-100 transition-[margin-left] duration-200 ease-in-out md:pb-0 ${
          collapsed ? "md:ml-[68px]" : "md:ml-60"
        }`}
      >
        {children}
      </main>
    </>
  );
}
