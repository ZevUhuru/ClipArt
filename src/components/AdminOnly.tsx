"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = useAppStore((state) => state.isAdmin);
  if (!isAdmin) return null;
  return <>{children}</>;
}

