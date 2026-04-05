"use client";

import { useRef, useCallback } from "react";
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {animations.map((anim) => (
        <AnimationCard key={anim.id} animation={anim} />
      ))}
    </div>
  );
}

function AnimationCard({ animation }: { animation: RelatedAnimation }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  return (
    <Link
      href={`/animations/${animation.slug}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-900">
        {animation.posterUrl && (
          <Image
            src={animation.posterUrl}
            alt={animation.title}
            fill
            className="object-contain transition-opacity group-hover:opacity-0"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            loading="lazy"
            unoptimized
          />
        )}
        <video
          ref={videoRef}
          src={animation.videoUrl}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity group-hover:opacity-100"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
          Video
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-xs font-medium text-gray-600">
          {animation.title}
        </p>
      </div>
    </Link>
  );
}
