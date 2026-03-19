"use client";

import Image from "next/image";
import { sampleImages } from "@/data/sampleGallery";

const COLUMN_COUNT = 6;

function splitIntoColumns<T>(items: T[], columns: number): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, i) => {
    cols[i % columns].push(item);
  });
  return cols;
}

const columns = splitIntoColumns(sampleImages, COLUMN_COUNT);

const columnSpeeds = [60, 55, 65, 50, 58, 62];

export function MosaicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
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
                {[...col, ...col].map((img, i) => (
                  <div
                    key={`${img.url}-${i}`}
                    className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/5"
                  >
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      className="rounded-2xl object-contain p-2"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Base dark wash across everything */}
      <div className="absolute inset-0 bg-[#0a0a0a]/40" />

      {/* Radial vignette -- much darker center stage for legibility, lighter edges for vivid images */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 55%, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.15) 100%)",
        }}
      />
    </div>
  );
}
