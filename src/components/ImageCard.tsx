"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { downloadClip } from "@/utils/downloadClip";

const STYLE_LABELS: Record<string, string> = {
  flat: "Flat",
  outline: "Outline",
  cartoon: "Cartoon",
  sticker: "Sticker",
  vintage: "Vintage",
  watercolor: "Watercolor",
  chibi: "Chibi",
  pixel: "Pixel Art",
  kawaii: "Kawaii",
  "3d": "3D Render",
  doodle: "Doodle",
  coloring: "Coloring Page",
};

function getAspectClass(ratio?: string) {
  if (ratio === "3:4") return "aspect-[3/4]";
  if (ratio === "4:3") return "aspect-[4/3]";
  return "aspect-square";
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export interface ImageCardImage {
  id?: string;
  slug: string;
  title: string;
  url: string;
  category?: string;
  style?: string;
  aspect_ratio?: string;
}

interface ImageCardProps {
  image: ImageCardImage;
  variant?: "clipart" | "coloring";
  href?: string;
  onClick?: () => void;
  showDownload?: boolean;
  showStyleBadge?: boolean;
  sizes?: string;
  className?: string;
  animationPreviewUrl?: string;
}

export function ImageCard({
  image,
  variant = "clipart",
  href,
  onClick,
  showDownload = true,
  showStyleBadge = true,
  sizes,
  className = "",
  animationPreviewUrl,
}: ImageCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animationPreviewUrl) return;
    const video = videoRef.current;
    const container = cardRef.current;
    if (!video || !container) return;

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

    observer.observe(container);
    return () => observer.disconnect();
  }, [animationPreviewUrl]);

  const isColoring = variant === "coloring";
  const isLandscape = isColoring && image.aspect_ratio === "4:3";
  const aspectClass = isColoring ? getAspectClass(image.aspect_ratio) : "aspect-square";
  const bgClass = isColoring ? "bg-white" : "bg-gray-50/80";
  const styleLabel = image.style ? STYLE_LABELS[image.style] : undefined;
  const filename = isColoring
    ? `coloring-page-${image.slug}.png`
    : `clip-art-${image.slug}.png`;

  const defaultSizes = isColoring
    ? "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
    : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw";

  const cardContent = (
    <>
      {/* Image/Video area — inset with rounding for a framed look */}
      <div className="p-2 pb-0" ref={cardRef}>
        <div className={`relative overflow-hidden rounded-xl ${aspectClass} ${bgClass}`}>
          {animationPreviewUrl ? (
            <>
              <video
                ref={videoRef}
                src={animationPreviewUrl}
                poster={image.url}
                muted
                loop
                playsInline
                preload="none"
                className="absolute inset-0 h-full w-full object-contain p-3"
              />
              <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                Video
              </span>
            </>
          ) : (
            <Image
              src={image.url}
              alt={`${image.title} — free ${isColoring ? "coloring page" : "clip art"}`}
              fill
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              sizes={sizes || defaultSizes}
              unoptimized
            />
          )}
        </div>
      </div>

      {/* Metadata footer */}
      <div className="relative px-3.5 pb-3 pt-2.5">
        <p className="line-clamp-1 text-[13px] font-semibold leading-snug text-gray-800">
          {image.title}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          {showStyleBadge && styleLabel ? (
            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {styleLabel}
            </span>
          ) : (
            <span />
          )}
          {showDownload && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                downloadClip(image.url, filename);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-300 opacity-0 transition-all hover:bg-pink-50 hover:text-pink-600 group-hover:opacity-100"
              title="Download"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  const cardClasses = [
    "group relative overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-sm",
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2",
    isLandscape ? "md:col-span-2" : "",
    onClick || href ? "cursor-pointer" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}>
        {cardContent}
      </div>
    );
  }

  return <div className={cardClasses}>{cardContent}</div>;
}

/* ── Skeleton loader ── */

interface ImageCardSkeletonProps {
  variant?: "clipart" | "coloring";
}

export function ImageCardSkeleton({ variant = "clipart" }: ImageCardSkeletonProps) {
  const aspectClass = variant === "coloring" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100/80 bg-white">
      <div className="p-2 pb-0">
        <div className={`${aspectClass} rounded-xl bg-gray-100`} />
      </div>
      <div className="px-3.5 pb-3 pt-2.5">
        <div className="h-4 w-3/4 rounded-md bg-gray-100" />
        <div className="mt-2 h-3 w-1/3 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
