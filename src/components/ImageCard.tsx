"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

function getAspectClass(ratio?: string) {
  if (ratio === "3:4") return "aspect-[3/4]";
  if (ratio === "4:3") return "aspect-[4/3]";
  return "aspect-square";
}

export interface ImageCardImage {
  id?: string;
  slug: string;
  title: string;
  url: string;
  transparent_url?: string;
  category?: string;
  style?: string;
  content_type?: string;
  aspect_ratio?: string;
}

interface ImageCardProps {
  image: ImageCardImage;
  variant?: "clipart" | "coloring" | "illustration" | "animations";
  href?: string;
  onClick?: () => void;
  sizes?: string;
  className?: string;
  animationPreviewUrl?: string;
}

export function ImageCard({
  image,
  variant = "clipart",
  href,
  onClick,
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
  const isIllustration = variant === "illustration" || variant === "animations";
  const isLandscape = isColoring && image.aspect_ratio === "4:3";
  const aspectClass = isIllustration
    ? getAspectClass(image.aspect_ratio || "4:3")
    : isColoring
      ? getAspectClass(image.aspect_ratio)
      : "aspect-square";
  const bgClass = isColoring ? "bg-white" : isIllustration ? "bg-gray-900/5" : "bg-gray-50/80";

  const defaultSizes = isColoring
    ? "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
    : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw";

  const cardContent = (
    <div className={`relative ${aspectClass}`} ref={cardRef}>
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
            className="absolute inset-0 h-full w-full object-contain"
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
          src={image.transparent_url ?? image.url}
          alt={`${image.title} — free ${isColoring ? "coloring page" : isIllustration ? "illustration" : "clip art"}`}
          fill
          className={`transition-transform duration-300 group-hover:scale-105 ${
            isIllustration ? "object-cover" : "object-contain p-2"
          }`}
          sizes={sizes || defaultSizes}
          unoptimized
        />
      )}

      {/* Hover hint — expand icon anchored bottom-right */}
      <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      </span>
    </div>
  );

  const cardClasses = [
    "group relative overflow-hidden",
    isIllustration ? "rounded-xl" : "rounded-2xl",
    bgClass,
    "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-gray-200",
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
  variant?: "clipart" | "coloring" | "illustration" | "animations";
}

const SKELETON_ASPECTS = ["aspect-[4/3]", "aspect-square", "aspect-[3/4]"];

export function ImageCardSkeleton({ variant = "clipart" }: ImageCardSkeletonProps) {
  if (variant === "illustration" || variant === "animations") {
    const aspect = SKELETON_ASPECTS[Math.floor(Math.random() * SKELETON_ASPECTS.length)];
    return (
      <div className="animate-pulse overflow-hidden rounded-xl bg-gray-100">
        <div className={aspect} />
      </div>
    );
  }

  const aspectClass = variant === "coloring" ? "aspect-[3/4]" : "aspect-square";
  const bgClass = variant === "coloring" ? "bg-white" : "bg-gray-50/80";

  return (
    <div className={`animate-pulse overflow-hidden rounded-2xl ${bgClass}`}>
      <div className={`${aspectClass}`} />
    </div>
  );
}
