"use client";

import { useMemo } from "react";
import Image from "next/image";
import { sampleImages } from "@/data/sampleGallery";

const COLUMN_COUNT = 6;
const columnSpeeds = [60, 55, 65, 50, 58, 62];

export interface MosaicAnimation {
  videoUrl: string;
  posterUrl: string;
}

interface MosaicTile {
  type: "image" | "video";
  url: string;
  title: string;
  videoUrl?: string;
}

function buildTiles(animations: MosaicAnimation[]): MosaicTile[] {
  const tiles: MosaicTile[] = sampleImages.map((img) => ({
    type: "image" as const,
    url: img.url,
    title: img.title,
  }));

  if (animations.length === 0) return tiles;

  const step = Math.max(Math.floor(tiles.length / animations.length), 4);
  animations.forEach((anim, i) => {
    const pos = Math.min(3 + i * step, tiles.length);
    tiles.splice(pos, 0, {
      type: "video",
      url: anim.posterUrl,
      title: "Animated clip art",
      videoUrl: anim.videoUrl,
    });
  });

  return tiles;
}

function splitIntoColumns<T>(items: T[], columns: number): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, i) => {
    cols[i % columns].push(item);
  });
  return cols;
}

export function MosaicBackground({ animations = [] }: { animations?: MosaicAnimation[] }) {
  const columns = useMemo(() => {
    const tiles = buildTiles(animations);
    return splitIntoColumns(tiles, COLUMN_COUNT);
  }, [animations]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="flex h-full w-full gap-3 px-3">
        {columns.map((col, colIndex) => {
          const isUp = colIndex % 2 === 0;
          const speed = columnSpeeds[colIndex];
          const animationName = isUp ? "scrollUp" : "scrollDown";

          const responsiveHide =
            colIndex >= 4
              ? "hidden lg:block"
              : colIndex >= 3
                ? "hidden md:block"
                : colIndex >= 2
                  ? "hidden sm:block"
                  : "";

          return (
            <div
              key={colIndex}
              className={`relative flex-1 overflow-hidden ${responsiveHide}`}
            >
              <div
                className="flex flex-col gap-3"
                style={{
                  animation: `${animationName} ${speed}s linear infinite`,
                }}
              >
                {[...col, ...col].map((tile, i) => (
                  <div
                    key={`${tile.url}-${i}`}
                    className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/5"
                  >
                    {tile.type === "video" && tile.videoUrl ? (
                      <video
                        src={tile.videoUrl}
                        poster={tile.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="none"
                        className="absolute inset-0 h-full w-full rounded-2xl object-contain"
                      />
                    ) : (
                      <Image
                        src={tile.url}
                        alt={`${tile.title} clip art`}
                        fill
                        className="rounded-2xl object-contain p-2"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Base dark wash */}
      <div className="absolute inset-0 bg-[#0a0a0a]/60 sm:bg-[#0a0a0a]/50" />

      {/* Studio spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Corner shadows */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 0% 0%, rgba(0,0,0,0.6) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 100% at 100% 0%, rgba(0,0,0,0.6) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 100% at 0% 100%, rgba(0,0,0,0.6) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 100% at 100% 100%, rgba(0,0,0,0.6) 0%, transparent 50%)",
        }}
      />

      {/* Extra dark zone behind steps + card area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 35% at 50% 65%, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}
      />

      {/* Subtle center glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 45%, rgba(255,255,255,0.03) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
