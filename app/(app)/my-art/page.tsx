"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { createBrowserClient } from "@/lib/supabase/client";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";

type ContentFilter = "all" | "clipart" | "coloring";

const PAGE_SIZE = 60;

function SignInPrompt() {
  const { openAuthModal } = useAppStore();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-400">
          Sign in to see your creations
        </p>
        <p className="mt-1 text-sm text-gray-300">
          Your creations will appear here after you generate them.
        </p>
        <button
          onClick={() => openAuthModal("signin")}
          className="btn-primary mt-6"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function CreationsGrid() {
  const { user } = useAppStore();
  const openDrawer = useImageDrawer((s) => s.open);

  const [items, setItems] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<ContentFilter>("all");

  const filterRef = useRef<ContentFilter>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (contentFilter: ContentFilter, offset: number) => {
      if (!user) return;
      const supabase = createBrowserClient();
      if (!supabase) return;

      let query = supabase
        .from("generations")
        .select("id, image_url, prompt, style, category, slug, aspect_ratio, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (contentFilter === "coloring") {
        query = query.eq("style", "coloring");
      } else if (contentFilter === "clipart") {
        query = query.neq("style", "coloring");
      }

      const { data } = await query;
      return (data || []) as Generation[];
    },
    [user],
  );

  const loadInitial = useCallback(
    async (contentFilter: ContentFilter) => {
      setIsLoading(true);
      setItems([]);
      setHasMore(false);
      filterRef.current = contentFilter;

      const data = await fetchPage(contentFilter, 0);
      if (!data || filterRef.current !== contentFilter) return;

      setItems(data);
      setHasMore(data.length >= PAGE_SIZE);
      setIsLoading(false);
    },
    [fetchPage],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const data = await fetchPage(filterRef.current, items.length);
    if (data) {
      setItems((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, items.length, fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (user) loadInitial(filter);
  }, [user, filter, loadInitial]);

  const handleFilterChange = (next: ContentFilter) => {
    setFilter(next);
  };

  const safeItems = items.filter((gen) => gen.id && gen.image_url);

  return (
    <>
      {/* Content type filter */}
      <div className="mb-6 inline-flex rounded-lg bg-gray-100 p-1">
        {(
          [
            { key: "all", label: "All" },
            { key: "clipart", label: "Clip Art" },
            { key: "coloring", label: "Coloring Pages" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
              filter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ImageGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <ImageCardSkeleton key={i} />
          ))}
        </ImageGrid>
      ) : safeItems.length > 0 ? (
        <>
          <ImageGrid>
            {safeItems.map((gen) => {
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
                    aspect_ratio: gen.aspect_ratio,
                  }}
                  variant={isColoring ? "coloring" : "clipart"}
                  onClick={() =>
                    openDrawer({
                      id: gen.id,
                      slug: gen.slug || gen.id,
                      title: gen.prompt,
                      url: gen.image_url,
                      category: gen.category || "free",
                      style: gen.style,
                      aspect_ratio: gen.aspect_ratio,
                    })
                  }
                />
              );
            })}
          </ImageGrid>

          <div ref={sentinelRef} className="h-px" />

          {isLoadingMore && (
            <div className="mt-6">
              <ImageGrid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ImageCardSkeleton key={`more-${i}`} />
                ))}
              </ImageGrid>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-400">
            {filter === "all"
              ? "No creations yet"
              : filter === "coloring"
                ? "No coloring pages yet"
                : "No clip art yet"}
          </p>
          <p className="mt-1 text-sm text-gray-300">
            Your creations will appear here after you generate them.
          </p>
        </div>
      )}
    </>
  );
}

export default function MyArtPage() {
  const { user } = useAppStore();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-futura text-2xl font-bold text-gray-900">My Creations</h1>
        {user && (
          <Link href="/create" className="btn-primary text-sm">
            Create new
          </Link>
        )}
      </div>

      {user ? <CreationsGrid /> : <SignInPrompt />}
    </div>
  );
}
