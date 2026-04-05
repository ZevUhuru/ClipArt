"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface RelatedAnimation {
  id: string;
  slug: string;
  videoUrl: string;
  posterUrl: string;
  title: string;
}

export function RelatedAnimationsGrid({
  animations,
}: {
  animations: RelatedAnimation[];
}) {
  return (
    <div className="columns-2 gap-3 sm:columns-3 md:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
      {animations.map((anim) => (
        <AnimationCard key={anim.id} animation={anim} />
      ))}
    </div>
  );
}

function AnimationCard({ animation }: { animation: RelatedAnimation }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);

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
    <Link
      ref={cardRef}
      href={`/animations/${animation.slug}`}
      className="group relative block overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-gray-200"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {animation.posterUrl ? (
          <Image
            src={animation.posterUrl}
            alt={animation.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            loading="lazy"
            unoptimized
          />
        ) : null}
        <video
          ref={videoRef}
          src={animation.videoUrl}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Hover-only badge */}
      <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v14l11-7-11-7z" />
        </svg>
        Animated
      </span>
    </Link>
  );
}
