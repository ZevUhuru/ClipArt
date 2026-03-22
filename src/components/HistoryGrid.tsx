"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useAppStore } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { createBrowserClient } from "@/lib/supabase/client";
import { downloadClip } from "@/utils/downloadClip";

export function HistoryGrid() {
  const { user, generations, generationsLoaded, setGenerations } = useAppStore();

  useEffect(() => {
    if (!user || generationsLoaded) return;

    async function fetchGenerations() {
      const supabase = createBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("generations")
        .select("id, image_url, prompt, style, category, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      setGenerations(data || []);
    }

    fetchGenerations();
  }, [user, generationsLoaded, setGenerations]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <p className="text-gray-400">Sign in to see your generation history.</p>
      </div>
    );
  }

  if (!generationsLoaded) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse overflow-hidden">
            <div className="aspect-square bg-gray-100" />
            <div className="p-3">
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <p className="text-lg font-medium text-gray-400">No generations yet</p>
        <p className="mt-1 text-sm text-gray-300">
          Your creations will appear here after you generate them.
        </p>
      </div>
    );
  }

  return <HistoryItems generations={generations} />;
}

function HistoryItems({ generations }: { generations: ReturnType<typeof useAppStore.getState>["generations"] }) {
  const openDrawer = useImageDrawer((s) => s.open);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {generations.map((gen) => (
        <div
          key={gen.id}
          className="card group cursor-pointer overflow-hidden"
          onClick={() =>
            openDrawer({
              id: gen.id,
              slug: gen.slug || gen.id,
              title: gen.prompt,
              url: gen.image_url,
              category: gen.category || "free",
              style: gen.style,
            })
          }
        >
          <div className="relative aspect-square bg-gray-50">
            <Image
              src={gen.image_url}
              alt={gen.prompt}
              fill
              className="object-contain p-3 transition-transform group-hover:scale-105"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between p-3">
            <p className="min-w-0 flex-1 truncate text-xs text-gray-500">{gen.prompt}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadClip(gen.image_url, `clip-art-${gen.id}.png`);
              }}
              className="ml-2 shrink-0 text-xs font-medium text-pink-600 opacity-0 transition-opacity group-hover:opacity-100"
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
