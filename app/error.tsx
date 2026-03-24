"use client";

import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <svg
            className="h-7 w-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          An unexpected error occurred. Please try again — if it keeps
          happening, try refreshing the page or going back home.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm text-gray-400 transition-colors hover:text-gray-600"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
