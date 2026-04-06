"use client";

import { useSidebar } from "@/stores/useSidebar";

function DesktopCornerOverlay({ position }: { position: "top" | "bottom" }) {
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

function MobileBottomCorner({ side }: { side: "left" | "right" }) {
  const radiusClass = side === "left" ? "rounded-bl-[16px]" : "rounded-br-[16px]";
  return (
    <div
      className="fixed z-[25] h-4 w-4 bg-[#1c1c27] md:hidden"
      style={{
        bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
        [side]: 0,
      }}
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
      <DesktopCornerOverlay position="top" />
      <DesktopCornerOverlay position="bottom" />
      <MobileBottomCorner side="left" />
      <MobileBottomCorner side="right" />
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
