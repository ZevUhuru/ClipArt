"use client";

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { formatDuration, TOPIC_LABELS } from "@/lib/learnUtils";
import type { LearnPostMeta } from "@/lib/learnTypes";

export function VideoCard({ post }: { post: LearnPostMeta }) {
  const thumbnailSrc =
    post.thumbnailUrl ||
    (post.muxPlaybackId
      ? `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=0`
      : null);

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/learn/${post.slug}`}
      className="group block min-w-0"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1 hover:border-pink-300 hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gray-900">
          {thumbnailSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailSrc}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                <Play
                  size={24}
                  color="rgba(255,255,255,0.8)"
                  fill="rgba(255,255,255,0.8)"
                  className="ml-0.5"
                />
              </div>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 font-mono text-xs text-white">
            <Clock size={12} />
            {formatDuration(post.durationSeconds)}
          </div>

          {/* Category badge */}
          {post.categoryLabel && (
            <div className="absolute left-2 top-2 rounded-full bg-white/92 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-gray-900">
              {post.categoryLabel}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col bg-gray-50/50 p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900">
            {post.title}
          </h3>

          {formattedDate && (
            <p className="mt-1.5 text-[13px] text-gray-400">{formattedDate}</p>
          )}

          {post.topic.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {post.topic.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-medium text-pink-600"
                >
                  {TOPIC_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
