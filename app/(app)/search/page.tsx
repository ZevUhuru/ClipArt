"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { categories } from "@/data/categories";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import type { StyleKey } from "@/lib/styles";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  style: string;
}

type ContentType = "clipart" | "coloring";

const PAGE_SIZE = 60;

const clipartCategories = categories.map((c) => ({ slug: c.slug, name: c.name }));

const STYLE_OPTIONS: { key: StyleKey; label: string }[] = [
  { key: "flat", label: "Flat" },
  { key: "outline", label: "Outline" },
  { key: "cartoon", label: "Cartoon" },
  { key: "sticker", label: "Sticker" },
  { key: "vintage", label: "Vintage" },
  { key: "watercolor", label: "Watercolor" },
  { key: "chibi", label: "Chibi" },
  { key: "pixel", label: "Pixel Art" },
  { key: "kawaii", label: "Kawaii" },
  { key: "3d", label: "3D Render" },
  { key: "doodle", label: "Doodle" },
];

function SearchImageGrid({
  items,
  contentType,
}: {
  items: SearchResult[];
  contentType: ContentType;
}) {
  const openDrawer = useImageDrawer((s) => s.open);
  const safeItems = items.filter((item) => item.id && item.url);
  const isColoring = contentType === "coloring";

  return (
    <ImageGrid variant={isColoring ? "coloring" : "clipart"}>
      {safeItems.map((item) => (
        <ImageCard
          key={item.id}
          variant={isColoring ? "coloring" : "clipart"}
          image={{
            id: item.id,
            slug: item.slug,
            title: item.title,
            url: item.url,
            category: item.category,
            style: item.style,
          }}
          onClick={() => openDrawer(item)}
        />
      ))}
    </ImageGrid>
  );
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [contentType, setContentType] = useState<ContentType>("clipart");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [coloringCategories, setColoringCategories] = useState<
    { slug: string; name: string }[]
  >([]);

  const currentQueryRef = useRef<string | undefined>();
  const currentCategoryRef = useRef<string | undefined>();
  const currentStyleRef = useRef<string | undefined>();
  const currentContentTypeRef = useRef<ContentType>("clipart");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories/coloring")
      .then((r) => r.json())
      .then((d) => setColoringCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const fetchResults = useCallback(
    async (
      query?: string,
      category?: string,
      style?: string,
      ct: ContentType = "clipart",
      offset = 0,
    ) => {
      const params = new URLSearchParams();
      params.set("content_type", ct);
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (style && ct !== "coloring") params.set("style", style);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));

      if (!query && !category && !style && ct === "clipart") return;

      const isFirstPage = offset === 0;
      if (isFirstPage) {
        setIsLoading(true);
        setResults([]);
      } else {
        setIsLoadingMore(true);
      }
      setHasSearched(true);

      currentQueryRef.current = query;
      currentCategoryRef.current = category;
      currentStyleRef.current = style;
      currentContentTypeRef.current = ct;

      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        const newResults: SearchResult[] = data.results || [];

        if (isFirstPage) {
          setResults(newResults);
        } else {
          setResults((prev) => [...prev, ...newResults]);
        }
        setHasMore(newResults.length >= PAGE_SIZE);
      } catch {
        if (isFirstPage) setResults([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchResults(
      currentQueryRef.current,
      currentCategoryRef.current,
      currentStyleRef.current,
      currentContentTypeRef.current,
      results.length,
    );
  }, [isLoadingMore, hasMore, results.length, fetchResults]);

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

  const handleSearch = useCallback(
    (query: string) => {
      setActiveCategory(null);
      setActiveStyle(null);
      if (!query.trim()) {
        setResults([]);
        setHasSearched(false);
        setHasMore(false);
        return;
      }
      fetchResults(query, undefined, undefined, contentType);
    },
    [fetchResults, contentType],
  );

  const handleContentTypeSwitch = useCallback(
    (ct: ContentType) => {
      setContentType(ct);
      setActiveCategory(null);
      setActiveStyle(null);
      setResults([]);
      setHasSearched(false);
      setHasMore(false);

      if (ct === "coloring") {
        fetchResults(undefined, undefined, undefined, ct);
      } else {
        fetchResults(undefined, "free", undefined, ct);
        setActiveCategory("free");
      }
    },
    [fetchResults],
  );

  const handleCategoryClick = useCallback(
    (slug: string) => {
      const next = activeCategory === slug ? null : slug;
      setActiveCategory(next);
      if (next) {
        fetchResults(undefined, next, activeStyle || undefined, contentType);
      } else if (activeStyle) {
        fetchResults(undefined, undefined, activeStyle, contentType);
      } else if (contentType === "coloring") {
        fetchResults(undefined, undefined, undefined, contentType);
      } else {
        setResults([]);
        setHasSearched(false);
        setHasMore(false);
      }
    },
    [activeCategory, activeStyle, contentType, fetchResults],
  );

  const handleStyleClick = useCallback(
    (styleKey: string) => {
      const next = activeStyle === styleKey ? null : styleKey;
      setActiveStyle(next);
      if (next) {
        fetchResults(undefined, activeCategory || undefined, next, contentType);
      } else if (activeCategory) {
        fetchResults(undefined, activeCategory, undefined, contentType);
      } else {
        setResults([]);
        setHasSearched(false);
        setHasMore(false);
      }
    },
    [activeStyle, activeCategory, contentType, fetchResults],
  );

  // Load default results on mount
  useEffect(() => {
    fetchResults(undefined, "free", undefined, "clipart");
    setActiveCategory("free");
    setHasSearched(true);
  }, [fetchResults]);

  const activeCategoryData =
    contentType === "clipart" && activeCategory
      ? categories.find((c) => c.slug === activeCategory)
      : null;

  const currentCategories =
    contentType === "coloring" ? coloringCategories : clipartCategories;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8">
      <div className="mx-auto max-w-2xl">
        <SearchBar
          onSearch={handleSearch}
          placeholder={
            contentType === "coloring"
              ? "Search coloring pages..."
              : "Search for clip art..."
          }
        />
      </div>

      {/* Tier 1: Content type toggle */}
      <div className="mt-5 flex items-center gap-4">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => handleContentTypeSwitch("clipart")}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
              contentType === "clipart"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Clip Art
          </button>
          <button
            onClick={() => handleContentTypeSwitch("coloring")}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
              contentType === "coloring"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Coloring Pages
          </button>
        </div>
      </div>

      {/* Tier 2: Category pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {currentCategories.map((tag) => (
          <button
            key={tag.slug}
            onClick={() => handleCategoryClick(tag.slug)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === tag.slug
                ? "bg-gray-900 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Tier 3: Style pills (clip art only) */}
      {contentType === "clipart" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveStyle(null);
              if (activeCategory) {
                fetchResults(undefined, activeCategory, undefined, contentType);
              }
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !activeStyle
                ? "bg-pink-600 text-white"
                : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            All Styles
          </button>
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleStyleClick(s.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeStyle === s.key
                  ? "bg-pink-600 text-white"
                  : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Cross-link to SEO category page */}
      {activeCategoryData && activeCategoryData.slug !== "free" && (
        <div className="mt-4">
          <Link
            href={`/${activeCategoryData.slug}`}
            className="inline-flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700"
          >
            Browse all {activeCategoryData.name.toLowerCase()} clip art
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}

      {/* Results grid */}
      <div className="mt-6">
        {isLoading ? (
          <ImageGrid variant={contentType === "coloring" ? "coloring" : "clipart"}>
            {Array.from({ length: 10 }).map((_, i) => (
              <ImageCardSkeleton
                key={i}
                variant={contentType === "coloring" ? "coloring" : "clipart"}
              />
            ))}
          </ImageGrid>
        ) : results.length > 0 ? (
          <>
            <SearchImageGrid items={results} contentType={contentType} />

            <div ref={sentinelRef} className="h-px" />

            {isLoadingMore && (
              <div className="mt-6">
                <ImageGrid variant={contentType === "coloring" ? "coloring" : "clipart"}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ImageCardSkeleton
                      key={`more-${i}`}
                      variant={contentType === "coloring" ? "coloring" : "clipart"}
                    />
                  ))}
                </ImageGrid>
              </div>
            )}
          </>
        ) : hasSearched ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-lg font-medium text-gray-400">No results found</p>
            <p className="mt-1 text-sm text-gray-300">
              Try a different search term or browse by category.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
