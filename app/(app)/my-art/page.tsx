"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { VideoPlayer } from "@/components/VideoPlayer";

interface AnimationItem {
  id: string;
  prompt: string;
  model: string;
  video_url: string;
  preview_url: string;
  thumbnail_url: string | null;
  source_image_url: string | null;
  source_title: string | null;
  source_slug: string | null;
  source_category: string | null;
  created_at: string;
}

type ContentFilter = "all" | "clipart" | "illustrations" | "coloring" | "animations";

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

  const [animations, setAnimations] = useState<AnimationItem[]>([]);

  const fetchPage = useCallback(
    async (contentFilter: ContentFilter, offset: number) => {
      if (!user) return;
      try {
        const params = new URLSearchParams({
          filter: contentFilter,
          offset: String(offset),
          limit: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/me/images?${params}`);
        if (!res.ok) return [];
        const { images } = await res.json();
        return (images || []) as Generation[];
      } catch {
        return [];
      }
    },
    [user],
  );

  const fetchAnimations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/me/images?filter=animations");
      if (!res.ok) return;
      const { animations: data } = await res.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: AnimationItem[] = (data || []).map((row: any) => {
        const source = row.source as Record<string, string> | null;
        return {
          id: row.id as string,
          prompt: row.prompt as string,
          model: row.model as string,
          video_url: row.video_url as string,
          preview_url: row.preview_url as string,
          thumbnail_url: row.thumbnail_url as string | null,
          source_image_url: source?.image_url || null,
          source_title: source?.title || null,
          source_slug: source?.slug || null,
          source_category: source?.category || null,
          created_at: row.created_at as string,
        };
      });

      setAnimations(items);
    } catch {
      setAnimations([]);
    }
  }, [user]);

  const loadInitial = useCallback(
    async (contentFilter: ContentFilter) => {
      setIsLoading(true);
      setItems([]);
      setHasMore(false);
      filterRef.current = contentFilter;

      if (contentFilter === "animations") {
        await fetchAnimations();
        setIsLoading(false);
        return;
      }

      const data = await fetchPage(contentFilter, 0);
      if (!data || filterRef.current !== contentFilter) return;

      setItems(data);
      setHasMore(data.length >= PAGE_SIZE);
      setIsLoading(false);
    },
    [fetchPage, fetchAnimations],
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

  const drawerList = safeItems.map((gen) => ({
    id: gen.id,
    slug: gen.slug || gen.id,
    title: gen.prompt,
    url: gen.image_url,
    category: gen.category || "free",
    style: gen.style,
    aspect_ratio: gen.aspect_ratio,
  }));

  return (
    <>
      {/* Content type filter */}
      <div className="mb-6 inline-flex rounded-lg bg-gray-100 p-1">
        {(
          [
            { key: "all", label: "All" },
            { key: "clipart", label: "Clip Art" },
            { key: "illustrations", label: "Illustrations" },
            { key: "coloring", label: "Coloring Pages" },
            { key: "animations", label: "Animations" },
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
      ) : filter === "animations" ? (
        animations.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {animations.map((anim) => {
              const drawerItem: import("@/stores/useImageDrawer").DrawerImage = {
                id: anim.id,
                slug: anim.id,
                title: anim.source_title || anim.prompt,
                url: anim.source_image_url || anim.thumbnail_url || "",
                category: anim.source_category || "free",
                style: "animation",
                videoUrl: anim.video_url,
              };
              const animDrawerList = animations.map((a) => ({
                id: a.id,
                slug: a.id,
                title: a.source_title || a.prompt,
                url: a.source_image_url || a.thumbnail_url || "",
                category: a.source_category || "free",
                style: "animation",
                videoUrl: a.video_url,
              }));

              return (
                <div
                  key={anim.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDrawer(drawerItem, animDrawerList)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDrawer(drawerItem, animDrawerList); }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="relative aspect-square bg-gray-50/80">
                    <VideoPlayer
                      src={anim.video_url}
                      poster={anim.source_image_url || anim.thumbnail_url || undefined}
                      mode="preview"
                      className="absolute inset-0"
                    />
                  </div>
                  <div className="px-3.5 pb-3 pt-2.5">
                    <p className="line-clamp-1 text-[13px] font-semibold leading-snug text-gray-800">
                      {anim.source_title || anim.prompt}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-500">
                        {anim.model.replace("kling-", "Kling ")}
                      </span>
                      <a
                        href={anim.video_url}
                        download={`animation-${anim.id}.mp4`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-gray-300 opacity-0 transition-all hover:bg-pink-50 hover:text-pink-600 group-hover:opacity-100"
                        title="Download MP4"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-lg font-medium text-gray-400">No animations yet</p>
            <p className="mt-1 text-sm text-gray-300">
              Animate your clip art to see them here.
            </p>
            <Link href="/animate" className="btn-primary mt-4 inline-block text-sm">
              Animate an image
            </Link>
          </div>
        )
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
                  onClick={() => {
                    const img = {
                      id: gen.id,
                      slug: gen.slug || gen.id,
                      title: gen.prompt,
                      url: gen.image_url,
                      category: gen.category || "free",
                      style: gen.style,
                      aspect_ratio: gen.aspect_ratio,
                    };
                    openDrawer(img, drawerList);
                  }}
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
                : filter === "illustrations"
                  ? "No illustrations yet"
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
