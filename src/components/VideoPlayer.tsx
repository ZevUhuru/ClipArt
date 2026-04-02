"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  mode?: "preview" | "detail";
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  mode = "detail",
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (mode !== "preview" || reducedMotion) return;

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [mode, reducedMotion]);

  if (reducedMotion && mode === "preview") {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <PlayIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
    );
  }

  const isPreview = mode === "preview";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isPreview}
        autoPlay={isPreview}
        loop
        playsInline
        controls={!isPreview}
        preload={isPreview ? "none" : "metadata"}
        className="h-full w-full object-contain"
      />
      {isPreview && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <PlayIcon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-4 w-4"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

interface AnimationBadgeProps {
  className?: string;
}

export function AnimationBadge({ className = "" }: AnimationBadgeProps) {
  return (
    <span
      className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm ${className}`}
    >
      <PlayIcon className="h-2.5 w-2.5" />
      Video
    </span>
  );
}
