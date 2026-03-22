"use client";

import Link from "next/link";
import { HistoryGrid } from "@/components/HistoryGrid";
import { useAppStore } from "@/stores/useAppStore";

function SignInPrompt() {
  const { openAuthModal } = useAppStore();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-400">
          Sign in to see your clip art
        </p>
        <p className="mt-1 text-sm text-gray-300">
          Your creations will appear here after you generate them.
        </p>
        <button
          onClick={() => openAuthModal("signin")}
          className="btn-primary mt-6"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

export default function MyArtPage() {
  const { user } = useAppStore();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-futura text-2xl font-bold text-gray-900">My Clip Art</h1>
        {user && (
          <Link href="/create" className="btn-primary text-sm">
            Create new
          </Link>
        )}
      </div>

      {user ? <HistoryGrid /> : <SignInPrompt />}
    </div>
  );
}
