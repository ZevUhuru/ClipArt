"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { formatDuration } from "@/lib/learnUtils";
import type { LearnPostMeta } from "@/lib/learnTypes";

interface RelatedVideosProps {
  posts: LearnPostMeta[];
  currentSlug?: string;
}

export function RelatedVideos({ posts, currentSlug }: RelatedVideosProps) {
  const filtered = posts.filter((p) => p.slug !== currentSlug).slice(0, 5);

  if (filtered.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          More videos
        </span>
        <Link
          href="/learn"
          className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
          style={{ textDecoration: "none" }}
        >
          Browse all
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.map((post) => {
          const thumb =
            post.thumbnailUrl ||
            (post.muxPlaybackId
              ? `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=0`
              : null);

          return (
            <Link
              key={post.slug}
              href={`/learn/${post.slug}`}
              className="group flex gap-3 rounded-xl border border-gray-200 bg-white p-2.5 transition-colors hover:border-pink-300"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
                    <Play size={16} color="rgba(255,255,255,0.6)" />
                  </div>
                )}
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 py-px font-mono text-[10px] text-white">
                  {formatDuration(post.durationSeconds)}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 overflow-hidden py-0.5">
                <h4 className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-900 transition-colors group-hover:text-pink-600">
                  {post.title}
                </h4>
                <p className="mt-1 text-[11px] text-gray-400">
                  {post.date
                    ? new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
