"use client";

import { useAppStore } from "@/stores/useAppStore";

interface SignUpCTAProps {
  variant?: "strip" | "block";
}

export function SignUpCTA({ variant = "strip" }: SignUpCTAProps) {
  const { openAuthModal, user } = useAppStore();

  function handleClick() {
    if (user) {
      window.location.href = "/create";
    } else {
      openAuthModal("signup");
    }
  }

  if (variant === "block") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 text-center">
        <p className="text-sm font-semibold text-gray-900">
          Start creating
        </p>
        <p className="mt-1 text-xs text-gray-500">
          15 free generations included
        </p>
        <button
          onClick={handleClick}
          className="mt-3 w-full rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
        >
          Try Free
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3.5 sm:flex-row sm:px-6">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          Start creating — 15 free generations
        </p>
        <p className="text-xs text-gray-500">
          Describe what you want and download it in seconds.
        </p>
      </div>
      <button
        onClick={handleClick}
        className="shrink-0 rounded-full bg-brand-gradient px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
      >
        Try Free
      </button>
    </div>
  );
}
