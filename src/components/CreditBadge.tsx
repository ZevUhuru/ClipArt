"use client";

import { useAppStore } from "@/stores/useAppStore";

export function CreditBadge() {
  const { credits, openBuyCreditsModal } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-pink-50 px-3 py-1 text-sm font-medium text-pink-700">
        {credits} credit{credits !== 1 ? "s" : ""}
      </span>
      <button
        onClick={openBuyCreditsModal}
        className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-medium text-white transition-all hover:shadow-md"
      >
        Buy Credits
      </button>
    </div>
  );
}
