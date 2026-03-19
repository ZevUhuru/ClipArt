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

      {/* Base dark wash -- dims everything uniformly */}
      <div className="absolute inset-0 bg-[#0a0a0a]/50" />

      {/* Studio spotlight -- bright center, dark edges like Doodles */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Corner shadows for extra depth */}
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

      {/* Extra dark zone behind steps + card area (lower center) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 35% at 50% 65%, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}
      />

      {/* Subtle center glow for the "studio light" feel */}
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
