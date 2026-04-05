"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { VideoPlayer } from "@/components/VideoPlayer";

interface AnimationItem {
  id: string;
  slug: string | null;
  prompt: string;
  model: string;
  video_url: string;
  preview_url: string;
  thumbnail_url: string | null;
  source_image_url: string | null;
  source_title: string | null;
  source_slug: string | null;
  source_category: string | null;
  source_aspect_ratio: string | null;
  created_at: string;
}

type ContentFilter = "all" | "clipart" | "illustrations" | "coloring" | "animations" | "shared";

interface SocialUpload {
  id: string;
  provider: string;
  platform_video_id: string | null;
  platform_url: string | null;
  title: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  animation: {
    id: string;
    video_url: string;
    thumbnail_url: string | null;
    prompt: string;
    source: { image_url: string; title: string } | null;
  } | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
};

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
  const [sharedUploads, setSharedUploads] = useState<SocialUpload[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);

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
          slug: (row.slug || null) as string | null,
          prompt: row.prompt as string,
          model: row.model as string,
          video_url: row.video_url as string,
          preview_url: row.preview_url as string,
          thumbnail_url: row.thumbnail_url as string | null,
          source_image_url: source?.image_url || null,
          source_title: source?.title || null,
          source_slug: source?.slug || null,
          source_category: source?.category || null,
          source_aspect_ratio: source?.aspect_ratio || null,
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

      if (contentFilter === "shared") {
        setSharedLoading(true);
        try {
          const res = await fetch("/api/me/social/uploads");
          const data = await res.json();
          setSharedUploads(data.uploads || []);
        } catch {
          setSharedUploads([]);
        } finally {
          setSharedLoading(false);
          setIsLoading(false);
        }
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
    content_type: gen.content_type,
    aspect_ratio: gen.aspect_ratio,
  }));

  const useMasonry = filter === "all" || filter === "illustrations";
  const gridVariant = useMasonry
    ? "illustration" as const
    : filter === "coloring"
      ? "coloring" as const
      : "clipart" as const;

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
            { key: "shared", label: "Shared" },
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
        <ImageGrid variant={gridVariant}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ImageCardSkeleton key={i} variant={gridVariant === "illustration" ? "illustration" : "clipart"} />
          ))}
        </ImageGrid>
      ) : filter === "shared" ? (
        sharedLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
          </div>
        ) : sharedUploads.length > 0 ? (
          <div className="space-y-3">
            {sharedUploads.map((upload) => {
              const thumb =
                upload.animation?.source?.image_url ||
                upload.animation?.thumbnail_url ||
                null;
              const uploadTitle =
                upload.title ||
                upload.animation?.source?.title ||
                upload.animation?.prompt ||
                "Untitled";
              return (
                <div
                  key={upload.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  {thumb && (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {uploadTitle}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-medium text-gray-500">
                        {PROVIDER_LABELS[upload.provider] || upload.provider}
                      </span>
                      <span>&middot;</span>
                      <span>
                        {new Date(upload.created_at).toLocaleDateString()}
                      </span>
                      <span>&middot;</span>
                      <span
                        className={
                          upload.status === "published"
                            ? "text-emerald-500"
                            : upload.status === "failed"
                              ? "text-red-500"
                              : "text-amber-500"
                        }
                      >
                        {upload.status}
                      </span>
                    </div>
                  </div>
                  {upload.platform_url && (
                    <a
                      href={upload.platform_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      View
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-400">
              No shared animations yet
            </p>
            <p className="mt-1 text-sm text-gray-300">
              Share your animations to YouTube and other platforms to see them here.
            </p>
          </div>
        )
      ) : filter === "animations" ? (
        animations.length > 0 ? (
          <div className="columns-2 gap-2.5 sm:columns-3 md:columns-4 [&>*]:mb-2.5 [&>*]:break-inside-avoid">
            {animations.map((anim) => {
              const drawerItem: import("@/stores/useImageDrawer").DrawerImage = {
                id: anim.id,
                slug: anim.slug || anim.source_slug || anim.id,
                title: anim.source_title || anim.prompt,
                url: anim.source_image_url || anim.thumbnail_url || "",
                category: anim.source_category || "free",
                style: "animation",
                aspect_ratio: anim.source_aspect_ratio || undefined,
                videoUrl: anim.video_url,
              };
              const animDrawerList = animations.map((a) => ({
                id: a.id,
                slug: a.slug || a.source_slug || a.id,
                title: a.source_title || a.prompt,
                url: a.source_image_url || a.thumbnail_url || "",
                category: a.source_category || "free",
                style: "animation",
                aspect_ratio: a.source_aspect_ratio || undefined,
                videoUrl: a.video_url,
              }));

              return (
                <div
                  key={anim.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDrawer(drawerItem, animDrawerList, true)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDrawer(drawerItem, animDrawerList, true); }}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-gray-200"
                >
                  <div
                    className="relative"
                    style={{ aspectRatio: anim.source_aspect_ratio ? anim.source_aspect_ratio.replace(":", "/") : "1/1" }}
                  >
                    <VideoPlayer
                      src={anim.video_url}
                      poster={anim.source_image_url || anim.thumbnail_url || undefined}
                      mode="preview"
                      className="absolute inset-0"
                    />
                  </div>
                  <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                    Animated
                  </span>
                  <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  </span>
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
          <ImageGrid variant={gridVariant}>
            {safeItems.map((gen) => {
              const ct = gen.content_type || (gen.style === "coloring" ? "coloring" : "clipart");
              const variant = ct === "illustration"
                ? "illustration" as const
                : ct === "coloring"
                  ? "coloring" as const
                  : "clipart" as const;
              const cardVariant = useMasonry ? "illustration" as const : variant;

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
                  variant={cardVariant}
                  onClick={() => {
                    const img = {
                      id: gen.id,
                      slug: gen.slug || gen.id,
                      title: gen.prompt,
                      url: gen.image_url,
                      category: gen.category || "free",
                      style: gen.style,
                      content_type: gen.content_type,
                      aspect_ratio: gen.aspect_ratio,
                    };
                    openDrawer(img, drawerList, true);
                  }}
                />
              );
            })}
          </ImageGrid>

          <div ref={sentinelRef} className="h-px" />

          {isLoadingMore && (
            <div className="mt-6">
              <ImageGrid variant={gridVariant}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ImageCardSkeleton key={`more-${i}`} variant={gridVariant === "illustration" ? "illustration" : "clipart"} />
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
