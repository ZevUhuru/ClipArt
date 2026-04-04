"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SharePopover } from "@/components/SharePopover";
import { UploadModal } from "@/components/UploadModal";
import { useAppStore } from "@/stores/useAppStore";

interface Props {
  animationId: string;
  title: string;
  prompt: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  slug: string;
  detailPath: string;
}

export function AnimationDetailClient({
  animationId,
  title,
  prompt,
  category,
  videoUrl,
  thumbnailUrl,
  slug,
  detailPath,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { user } = useAppStore();

  return (
    <div className="space-y-3">
      {/* Download */}
      <button
        onClick={() => {
          const a = document.createElement("a");
          a.href = `/api/download?url=${encodeURIComponent(videoUrl)}`;
          a.download = `${slug}-animation.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
        className="btn-primary flex w-full items-center justify-center py-3.5 text-sm"
      >
        <svg
          className="-ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Animation
      </button>

      {/* Share */}
      <div className="relative">
        <button
          onClick={() => setShareOpen(!shareOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
        {shareOpen && (
          <SharePopover
            url={detailPath}
            title={title}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>

      {/* Upload to YouTube — only for logged-in users (server can't check ownership without exposing user_id) */}
      {user && (
        <button
          onClick={() => setUploadOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Upload to YouTube
        </button>
      )}

      <AnimatePresence>
        {uploadOpen && (
          <UploadModal
            animation={{
              id: animationId,
              title,
              prompt,
              category,
              videoUrl,
              thumbnailUrl: thumbnailUrl || undefined,
            }}
            onClose={() => setUploadOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
