"use client";

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";
import { categories } from "@/data/categories";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { type StyleKey, VALID_STYLES, STYLE_LABELS } from "@/lib/styles";
import { StyleIndicator } from "@/data/styleIndicators";
import {
  ContentTypeTabs,
  FilterChipRow,
  ActiveFilters,
  SortSelect,
  ResultCount,
  FilterDrawer,
  type TabItem,
  type ChipItem,
} from "@/components/filters";
import { useFilterState, type ContentType } from "@/hooks/useFilterState";

const CONTENT_TABS: TabItem[] = [
  { key: "clipart", label: "Clip Art" },
  { key: "illustration", label: "Illustrations" },
  { key: "coloring", label: "Coloring Pages" },
  { key: "animations", label: "Animations" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "featured", label: "Featured" },
  { key: "oldest", label: "Oldest" },
];

const clipartCategoryChips: ChipItem[] = categories.map((c) => ({
  key: c.slug,
  label: c.name,
}));

function buildStyleChips(ct: "clipart" | "illustration"): ChipItem[] {
  return VALID_STYLES[ct].map((key) => ({
    key,
    label: STYLE_LABELS[key] || key,
    indicator: <StyleIndicator styleKey={key} />,
  }));
}

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  style: string;
  content_type?: string;
  videoUrl?: string;
  previewUrl?: string;
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const {
    filters,
    results,
    isLoading,
    isLoadingMore,
    hasMore,
    hasSearched,
    totalCount,
    activeFilterCount,
    setContentType,
    setCategory,
    setStyle,
    setQuery,
    setSort,
    clearFilter,
    clearAll,
    loadMore,
  } = useFilterState({ mode: "public", defaultSort: "newest" });

  const openDrawer = useImageDrawer((s) => s.open);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [coloringCategories, setColoringCategories] = useState<ChipItem[]>([]);
  const [illustrationCategories, setIllustrationCategories] = useState<ChipItem[]>([]);

  useEffect(() => {
    fetch("/api/categories/coloring")
      .then((r) => r.json())
      .then((d) =>
        setColoringCategories(
          (d.categories || []).map((c: { slug: string; name: string }) => ({
            key: c.slug,
            label: c.name,
          })),
        ),
      )
      .catch(() => {});
    fetch("/api/categories/illustration")
      .then((r) => r.json())
      .then((d) =>
        setIllustrationCategories(
          (d.categories || []).map((c: { slug: string; name: string }) => ({
            key: c.slug,
            label: c.name,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const currentCategoryChips = useMemo(() => {
    if (filters.contentType === "coloring") return coloringCategories;
    if (filters.contentType === "illustration") return illustrationCategories;
    return clipartCategoryChips;
  }, [filters.contentType, coloringCategories, illustrationCategories]);

  const currentStyleChips = useMemo(() => {
    if (filters.contentType === "clipart") return buildStyleChips("clipart");
    if (filters.contentType === "illustration") return buildStyleChips("illustration");
    return [];
  }, [filters.contentType]);

  const showCategoryRow = filters.contentType !== "animations";
  const showStyleRow = filters.contentType === "clipart" || filters.contentType === "illustration";

  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; type: "category" | "style" | "query" }[] = [];
    if (filters.query) list.push({ key: "q", label: `"${filters.query}"`, type: "query" });
    if (filters.category) {
      const cat = currentCategoryChips.find((c) => c.key === filters.category);
      list.push({ key: "cat", label: cat?.label || filters.category, type: "category" });
    }
    if (filters.style) {
      list.push({ key: "style", label: STYLE_LABELS[filters.style as StyleKey] || filters.style, type: "style" });
    }
    return list;
  }, [filters, currentCategoryChips]);

  const activeCategoryData =
    filters.contentType === "clipart" && filters.category
      ? categories.find((c) => c.slug === filters.category)
      : null;

  const isColoring = filters.contentType === "coloring";
  const gridVariant = isColoring ? "coloring" as const : "clipart" as const;

  const handleSearch = useCallback((q: string) => setQuery(q), [setQuery]);

  const safeResults = results.filter((item) => item.id && (item.url || item.videoUrl));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8">
      {/* Search */}
      <div className="mx-auto max-w-2xl">
        <SearchBar
          onSearch={handleSearch}
          placeholder={
            filters.contentType === "coloring" ? "Search coloring pages..."
            : filters.contentType === "illustration" ? "Search illustrations..."
            : filters.contentType === "animations" ? "Search animations..."
            : "Search for clip art..."
          }
          defaultValue={filters.query || ""}
        />
      </div>

      {/* Content type tabs */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <ContentTypeTabs
          tabs={CONTENT_TABS}
          activeKey={filters.contentType}
          onSelect={(key) => setContentType(key as ContentType)}
        />

        {/* Mobile filter trigger */}
        {(showCategoryRow || showStyleRow) && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Desktop filter rows */}
      <div className="hidden md:block">
        {showCategoryRow && currentCategoryChips.length > 0 && (
          <div className="mt-4">
            <FilterChipRow
              items={currentCategoryChips}
              activeKey={filters.category}
              onSelect={setCategory}
              maxVisible={8}
            />
          </div>
        )}

        {showStyleRow && (
          <div className="mt-3">
            <FilterChipRow
              items={currentStyleChips}
              activeKey={filters.style}
              onSelect={setStyle}
              maxVisible={7}
              allLabel="All Styles"
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Active filters + result count + sort */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {activeFilters.length > 0 && (
              <ActiveFilters
                filters={activeFilters}
                onRemove={clearFilter}
                onClearAll={clearAll}
              />
            )}
          </AnimatePresence>
          <ResultCount
            total={totalCount}
            isLoading={isLoading}
            contentType={filters.contentType}
          />
        </div>
        <SortSelect
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(key) => setSort(key as "newest" | "featured" | "oldest")}
        />
      </div>

      {/* Cross-link to SEO category page */}
      {activeCategoryData && activeCategoryData.slug !== "free" && (
        <div className="mt-3">
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
        <AnimatePresence mode="wait">
          <motion.div
            key={filters.contentType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <ImageGrid variant={gridVariant}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <ImageCardSkeleton key={i} variant={gridVariant} />
                ))}
              </ImageGrid>
            ) : safeResults.length > 0 ? (
              <>
                <ImageGrid variant={gridVariant}>
                  {safeResults.map((item: SearchResult) => (
                    <ImageCard
                      key={item.id}
                      variant={gridVariant}
                      image={{
                        id: item.id,
                        slug: item.slug,
                        title: item.title,
                        url: item.url,
                        category: item.category,
                        style: item.style,
                      }}
                      onClick={() => openDrawer(item, safeResults as SearchResult[])}
                      animationPreviewUrl={item.previewUrl || undefined}
                    />
                  ))}
                </ImageGrid>

                <div ref={sentinelRef} className="h-px" />

                {isLoadingMore && (
                  <div className="mt-6">
                    <ImageGrid variant={gridVariant}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <ImageCardSkeleton key={`more-${i}`} variant={gridVariant} />
                      ))}
                    </ImageGrid>
                  </div>
                )}
              </>
            ) : hasSearched ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-12 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="mt-4 text-base font-medium text-gray-500">
                  No {filters.contentType === "coloring" ? "coloring pages" : filters.contentType === "illustration" ? "illustrations" : filters.contentType === "animations" ? "animations" : "clip art"} found
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Try a different search term or adjust your filters.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categoryItems={currentCategoryChips}
        styleItems={currentStyleChips}
        activeCategory={filters.category}
        activeStyle={filters.style}
        onCategorySelect={setCategory}
        onStyleSelect={setStyle}
        onReset={() => { clearAll(); setDrawerOpen(false); }}
        showStyles={showStyleRow}
      />
    </div>
  );
}
