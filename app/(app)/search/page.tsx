"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { categories } from "@/data/categories";
import { downloadClip } from "@/utils/downloadClip";
import { useImageDrawer } from "@/stores/useImageDrawer";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  style: string;
}

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

function ImageGrid({ items }: { items: SearchResult[] }) {
  const openDrawer = useImageDrawer((s) => s.open);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.id} className="card group overflow-hidden">
          <button
            onClick={() => openDrawer(item)}
            className="relative block w-full aspect-square bg-gray-50 text-left"
          >
            <Image
              src={item.url}
              alt={item.title}
              fill
              className="object-contain p-3 transition-transform group-hover:scale-105"
              unoptimized
            />
          </button>
          <div className="flex items-center justify-between p-3">
            <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
              {item.title}
            </p>
            <button
              onClick={() => downloadClip(item.url, `clip-art-${item.id}.png`)}
              className="ml-2 shrink-0 text-xs font-medium text-pink-600 hover:text-pink-700"
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchResults = useCallback(async (query?: string, category?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (!query && !category) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setActiveCategory(null);
      if (!query.trim()) {
        setResults([]);
        setHasSearched(false);
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3">
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <ImageGrid items={results} />
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
