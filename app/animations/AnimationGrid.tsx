"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "./page";

function AnimationCard({ anim }: { anim: AnimationItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const card = cardRef.current;
    if (!video || !card) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-purple-400/40"
    >
      <video
        ref={videoRef}
        src={anim.videoUrl}
        poster={anim.posterUrl}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-contain"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="line-clamp-2 text-xs font-medium text-white">
          {anim.prompt}
        </p>
        <div className="mt-2 flex gap-2">
          <a
            href={anim.videoUrl}
            download={`${anim.slug}-animation.mp4`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>

      {/* Video badge */}
      <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-purple-500/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
        <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v14l11-7-11-7z" />
        </svg>
        Video
      </span>
    </div>
  );
}

export function AnimationGrid({ animations }: { animations: AnimationItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {animations.map((anim) => (
        <AnimationCard key={anim.id} anim={anim} />
      ))}
    </div>
  );
}
