"use client";

import { useState } from "react";
import { SharePopover } from "@/components/SharePopover";

interface Props {
  slug: string;
  videoUrl: string;
  detailPath: string;
  title: string;
}

export function AnimationDetailClient({
  slug,
  videoUrl,
  detailPath,
  title,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="mt-8 space-y-3">
      {/* Download CTA with shimmer */}
      <button
        onClick={() => {
          const a = document.createElement("a");
          a.href = `/api/download?url=${encodeURIComponent(videoUrl)}`;
          a.download = `${slug}-animation.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
        className="btn-primary group relative w-full overflow-hidden py-4 text-base"
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <svg
          className="-ml-1 mr-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Free Animation
      </button>

      {/* Share */}
      <div className="relative">
        <button
          onClick={() => setShareOpen(!shareOpen)}
          className="btn-secondary w-full justify-center py-3.5 text-base"
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share Animation
        </button>
        {shareOpen && (
          <SharePopover
            url={detailPath}
            title={title}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
