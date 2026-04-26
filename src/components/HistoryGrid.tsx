"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { createBrowserClient } from "@/lib/supabase/client";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";

export function HistoryGrid() {
  const { user, generations, generationsLoaded, setGenerations } = useAppStore();

  useEffect(() => {
    if (!user || generationsLoaded) return;

    async function fetchGenerations() {
      const supabase = createBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("generations")
        .select("id, image_url, transparent_image_url, prompt, style, content_type, category, slug, aspect_ratio, model, created_at")
        .eq("user_id", user!.id)
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
      <ImageGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <ImageCardSkeleton key={i} />
        ))}
      </ImageGrid>
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
  const safeGenerations = generations.filter((gen) => gen.id && gen.image_url);

  return (
    <ImageGrid>
      {safeGenerations.map((gen) => {
        const isColoring = gen.style === "coloring";
        return (
          <ImageCard
            key={gen.id}
            image={{
              id: gen.id,
              slug: gen.slug || gen.id,
              title: gen.prompt,
              url: gen.image_url,
              category: gen.category || "free",
              style: gen.style,
              content_type: gen.content_type,
              aspect_ratio: gen.aspect_ratio,
            }}
            variant={isColoring ? "coloring" : "clipart"}
            onClick={() =>
              openDrawer({
                id: gen.id,
                slug: gen.slug || gen.id,
                title: gen.prompt,
                url: gen.image_url,
                transparent_url: gen.transparent_image_url ?? undefined,
                category: gen.category || "free",
                style: gen.style,
                content_type: gen.content_type,
                aspect_ratio: gen.aspect_ratio,
                prompt: gen.prompt,
                model: gen.model || undefined,
              })
            }
          />
        );
      })}
    </ImageGrid>
  );
}
