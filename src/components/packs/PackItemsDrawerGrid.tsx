"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useImageDrawer, type DrawerImage } from "@/stores/useImageDrawer";

interface PackItem {
  id: string;
  is_exclusive: boolean;
  generations: {
    id: string;
    title: string | null;
    slug: string | null;
    prompt: string;
    image_url: string;
    transparent_image_url: string | null;
    has_transparency: boolean | null;
    style: string;
    content_type: string;
    category: string | null;
    aspect_ratio: string | null;
    model: string | null;
  };
}

interface PackItemsDrawerGridProps {
  items: PackItem[];
  hiddenCount: number;
}

function toDrawerImage(item: PackItem): DrawerImage {
  const gen = item.generations;

  return {
    id: gen.id,
    slug: gen.slug || gen.id,
    title: gen.title || gen.prompt,
    url: gen.image_url,
    transparent_url: gen.transparent_image_url || undefined,
    has_transparency: gen.has_transparency ?? undefined,
    category: gen.category || "free",
    style: gen.style || "flat",
    content_type: gen.content_type,
    aspect_ratio: gen.aspect_ratio || undefined,
    prompt: gen.prompt,
    model: gen.model || undefined,
  };
}

export function PackItemsDrawerGrid({ items, hiddenCount }: PackItemsDrawerGridProps) {
  const openDrawer = useImageDrawer((state) => state.open);
  const drawerItems = useMemo(() => items.map(toDrawerImage), [items]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item, index) => {
        const gen = item.generations;
        const title = gen.title || gen.prompt.slice(0, 40);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => openDrawer(drawerItems[index], drawerItems)}
            className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
            aria-label={`Open ${title}`}
            title={`Open ${title}`}
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 transition-all group-hover:shadow-md">
              <Image
                src={gen.transparent_image_url || gen.image_url}
                alt={title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              />
            </div>
            <p className="mt-1.5 truncate text-xs text-gray-500 transition-colors group-hover:text-pink-600">
              {title}
            </p>
          </button>
        );
      })}

      {hiddenCount > 0 && (
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-300">+{hiddenCount}</p>
            <p className="mt-1 text-[10px] font-semibold text-gray-400">more items</p>
          </div>
        </div>
      )}
    </div>
  );
}
