"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";

interface RecentCreationsStripProps {
  contentType?: string;
  filterFn?: (gen: { style: string; content_type?: string }) => boolean;
  maxItems?: number;
}

export function RecentCreationsStrip({
  contentType,
  filterFn,
  maxItems = 8,
}: RecentCreationsStripProps) {
  const { user, generations, generationsLoaded } = useAppStore();
  const openDrawer = useImageDrawer((s) => s.open);

  if (!user || !generationsLoaded) return null;

  const filtered = generations.filter((g) => {
    if (!g.id || !g.image_url) return false;
    if (filterFn) return filterFn(g);
    if (contentType) return g.content_type === contentType;
    return true;
  });

  if (filtered.length === 0) return null;

  const items = filtered.slice(0, maxItems);
  const drawerList = items.map((g) => ({
    id: g.id,
    slug: g.slug || g.id,
    title: g.title || g.prompt,
    url: g.image_url,
    category: g.category || "free",
    style: g.style,
    content_type: g.content_type,
    aspect_ratio: g.aspect_ratio,
    prompt: g.prompt,
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Recent creations
        </p>
        <Link
          href="/my-art"
          className="text-xs font-medium text-pink-500 transition-colors hover:text-pink-700"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {items.map((gen, idx) => (
          <button
            key={gen.id}
            type="button"
            onClick={() => openDrawer(drawerList[idx], drawerList, true)}
            className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gen.image_url}
              alt={gen.prompt}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
