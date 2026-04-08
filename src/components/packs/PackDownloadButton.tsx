"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface PackDownloadButtonProps {
  packId: string;
  isFree: boolean;
  priceCents: number | null;
  zipReady: boolean;
}

export function PackDownloadButton({
  packId,
  isFree,
  priceCents,
  zipReady,
}: PackDownloadButtonProps) {
  const { user, openAuthModal } = useAppStore();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (!user) {
      openAuthModal("signup");
      return;
    }

    if (!isFree) {
      setDownloading(true);
      try {
        const checkRes = await fetch(`/api/packs/${packId}/download`, {
          method: "POST",
        });
        const checkData = await checkRes.json();

        if (checkRes.ok && checkData.download_url) {
          const link = document.createElement("a");
          link.href = checkData.download_url;
          link.download = "";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloading(false);
          return;
        }

        const res = await fetch("/api/packs/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pack_id: packId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      } finally {
        setDownloading(false);
      }
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const res = await fetch(`/api/packs/${packId}/download`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Download failed");
      }

      if (data.download_url) {
        const link = document.createElement("a");
        link.href = data.download_url;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, [user, packId, isFree, openAuthModal]);

  if (!zipReady) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-xl bg-gray-200 px-6 py-3 text-sm font-bold text-gray-400"
      >
        Pack not ready yet
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-50"
      >
        {downloading ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Downloading...
          </>
        ) : !user ? (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Sign Up Free to Download
          </>
        ) : isFree ? (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Free
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Buy for ${((priceCents || 0) / 100).toFixed(2)}
          </>
        )}
      </button>

      {!user && (
        <p className="mt-2 text-xs text-gray-400">
          Free signup includes 10 credits to create your own clip art
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
