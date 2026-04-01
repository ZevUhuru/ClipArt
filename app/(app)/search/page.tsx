"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { categories } from "@/data/categories";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  style: string;
}

const PAGE_SIZE = 60;
const categoryTags = categories.map((c) => ({ slug: c.slug, name: c.name }));

const slugToApiCategory: Record<string, string> = {
  christmas: "christmas",
  halloween: "halloween",
  flower: "flowers",
  cat: "cats",
  thanksgiving: "food",
};

function resolveApiCategory(slug: string): string {
  return slugToApiCategory[slug] || slug;
}

function SearchImageGrid({ items }: { items: SearchResult[] }) {
  const openDrawer = useImageDrawer((s) => s.open);
  const safeItems = items.filter((item) => item.id && item.url);

  return (
    <ImageGrid>
      {safeItems.map((item) => (
        <ImageCard
          key={item.id}
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const currentQueryRef = useRef<string | undefined>();
  const currentCategoryRef = useRef<string | undefined>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(
    async (query?: string, category?: string, offset = 0) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (!query && !category) return;

      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));

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
      if (!query.trim()) {
        setResults([]);
        setHasSearched(false);
        setHasMore(false);
        return;
      }
      fetchResults(query);
    },
    [fetchResults],
  );

  const handleCategoryClick = useCallback(
    (slug: string) => {
      const next = activeCategory === slug ? null : slug;
      setActiveCategory(next);
      if (next) {
        fetchResults(undefined, resolveApiCategory(next));
      } else {
        setResults([]);
        setHasSearched(false);
        setHasMore(false);
      }
    },
    [activeCategory, fetchResults],
  );

  useEffect(() => {
    fetchResults(undefined, "free");
    setActiveCategory("free");
    setHasSearched(true);
  }, [fetchResults]);

  const activeCategoryData = activeCategory
    ? categories.find((c) => c.slug === activeCategory)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8">
      <div className="mx-auto max-w-2xl">
        <SearchBar onSearch={handleSearch} placeholder="Search for clip art..." />
      </div>

      {/* Category tags */}
      <div className="mt-5 flex flex-wrap gap-2">
        {categoryTags.map((tag) => (
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
          <ImageGrid>
            {Array.from({ length: 10 }).map((_, i) => (
              <ImageCardSkeleton key={i} />
            ))}
          </ImageGrid>
        ) : results.length > 0 ? (
          <>
            <SearchImageGrid items={results} />

            {/* Infinite scroll sentinel */}
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
