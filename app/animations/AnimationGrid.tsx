"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { AnimationItem } from "./page";

function AnimationCard({ anim }: { anim: AnimationItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const card = wrapperRef.current;
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

  const cssAspectRatio = anim.aspectRatio
    ? anim.aspectRatio.replace(":", "/")
    : "1/1";

  return (
    <Link
      href={`/animations/${anim.slug}`}
      ref={wrapperRef}
      className="group relative overflow-hidden rounded-xl bg-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-purple-400/40"
    >
      <div className="relative" style={{ aspectRatio: cssAspectRatio }}>
        <video
          ref={videoRef}
          src={anim.videoUrl}
          poster={anim.posterUrl}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Animated badge */}
      <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v14l11-7-11-7z" />
        </svg>
        Animated
      </span>

      {/* Expand icon */}
      <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      </span>
    </Link>
  );
}

function useColumnCount() {
  const [cols, setCols] = useState(4);

  const update = useCallback(() => {
    const w = window.innerWidth;
    setCols(w < 640 ? 2 : w < 768 ? 3 : 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  return cols;
}

function distributeItems(items: AnimationItem[], colCount: number) {
  const columns: AnimationItem[][] = Array.from({ length: colCount }, () => []);
  const heights = new Array(colCount).fill(0);

  for (const item of items) {
    const [w, h] = (item.aspectRatio || "1:1").split(":").map(Number);
    const normalizedHeight = (h || 1) / (w || 1);

    const shortestIdx = heights.indexOf(Math.min(...heights));
    columns[shortestIdx].push(item);
    heights[shortestIdx] += normalizedHeight;
  }

  return columns;
}

export function AnimationGrid({ animations }: { animations: AnimationItem[] }) {
  const colCount = useColumnCount();
  const columns = useMemo(
    () => distributeItems(animations, colCount),
    [animations, colCount],
  );

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
    >
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          {col.map((anim) => (
            <AnimationCard key={anim.id} anim={anim} />
          ))}
        </div>
      ))}
    </div>
  );
}
