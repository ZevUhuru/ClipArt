"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ImageCard } from "@/components/ImageCard";

export interface MosaicIllustration {
  slug: string;
  title: string;
  url: string;
  category: string;
  aspect_ratio?: string;
  transparent_url?: string;
}

interface IllustrationMosaicGridProps {
  items: MosaicIllustration[];
  /** URL prefix; href is built as `{basePath}/{item.category}/{item.slug}`. Defaults to "/illustrations". */
  basePath?: string;
  sizes?: string;
  /** When provided, cards fire this callback instead of navigating via href. */
  onItemClick?: (item: MosaicIllustration) => void;
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

function distributeByHeight(items: MosaicIllustration[], colCount: number): MosaicIllustration[][] {
  const columns: MosaicIllustration[][] = Array.from({ length: colCount }, () => []);
  const heights = new Array<number>(colCount).fill(0);

  for (const item of items) {
    const [w, h] = (item.aspect_ratio || "4:3").split(":").map(Number);
    const normalizedHeight = (h || 3) / (w || 4);
    const shortestIdx = heights.indexOf(Math.min(...heights));
    columns[shortestIdx].push(item);
    heights[shortestIdx] += normalizedHeight;
  }

  return columns;
}

export function IllustrationMosaicGrid({ items, basePath = "/illustrations", sizes, onItemClick }: IllustrationMosaicGridProps) {
  const colCount = useColumnCount();
  const columns = useMemo(() => distributeByHeight(items, colCount), [items, colCount]);

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
    >
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          {col.map((item) => (
            <ImageCard
              key={item.slug}
              variant="illustration"
              image={{
                slug: item.slug,
                title: item.title,
                url: item.url,
                category: item.category,
                aspect_ratio: item.aspect_ratio,
                transparent_url: item.transparent_url,
              }}
              {...(onItemClick
                ? { onClick: () => onItemClick(item) }
                : { href: `${basePath}/${item.category}/${item.slug}` }
              )}
              sizes={sizes || "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
