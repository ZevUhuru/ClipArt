"use client";

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";
import { categories } from "@/data/categories";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { VideoPlayer } from "@/components/VideoPlayer";
import { type StyleKey, VALID_STYLES, STYLE_LABELS } from "@/lib/styles";
import { StyleIndicator } from "@/data/styleIndicators";
import {
  ContentTypeTabs,
  FilterPopover,
  ActiveFilters,
  SortSelect,
  ResultCount,
  FilterDrawer,
  type TabItem,
  type ChipItem,
} from "@/components/filters";
import { useFilterState, type ContentType } from "@/hooks/useFilterState";
import { ExploreTabs } from "@/components/ExploreTabs";

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
  transparent_url?: string;
  has_transparency?: boolean;
  description: string;
  category: string;
  style: string;
  content_type?: string;
  aspect_ratio?: string;
  videoUrl?: string;
  previewUrl?: string;
  model?: string;
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

  const openDrawerRaw = useImageDrawer((s) => s.open);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const openDrawer = useCallback((item: SearchResult, list: SearchResult[]) => {
    const toDrawer = (r: SearchResult) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      url: r.url,
      transparent_url: r.transparent_url,
      has_transparency: r.has_transparency,
      category: r.category,
      style: r.style,
      content_type: r.content_type,
      aspect_ratio: r.aspect_ratio,
      videoUrl: r.videoUrl,
      prompt: r.description,
      model: r.model,
    });
    openDrawerRaw(toDrawer(item), list.map(toDrawer));
  }, [openDrawerRaw]);
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

  const gridVariant =
    filters.contentType === "coloring" ? "coloring" as const
    : filters.contentType === "illustration" ? "illustration" as const
    : filters.contentType === "animations" ? "animations" as const
    : "clipart" as const;

  const handleSearch = useCallback((q: string) => setQuery(q), [setQuery]);

  const safeResults = results.filter((item) => item.id && (item.url || item.videoUrl));

  return (
    <div className="pb-8">
      {/* Sticky search + toolbar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-3">
          <div className="mb-3">
            <ExploreTabs />
          </div>
          <SearchBar
            onSearch={handleSearch}
            placeholders={
              filters.contentType === "coloring"
                ? ["Dinosaur coloring page...", "Flowers to color...", "Princess castle..."]
                : filters.contentType === "illustration"
                  ? ["Mountain landscape...", "Cozy coffee shop...", "Tropical sunset..."]
                  : filters.contentType === "animations"
                    ? ["Dancing cat...", "Flying rocket...", "Waving hello..."]
                    : ["A happy sun wearing sunglasses...", "Wedding couple...", "Cute cat playing piano...", "Birthday cake with candles..."]
            }
            defaultValue={filters.query || ""}
          />

          {/* Toolbar: Tabs + filter popovers + sort */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <ContentTypeTabs
                tabs={CONTENT_TABS}
                activeKey={filters.contentType}
                onSelect={(key) => setContentType(key as ContentType)}
              />
              {showCategoryRow && currentCategoryChips.length > 0 && (
                <FilterPopover
                  label="Category"
                  items={currentCategoryChips}
                  activeKey={filters.category}
                  onSelect={setCategory}
                  allLabel="All Categories"
                />
              )}
              {showStyleRow && (
                <FilterPopover
                  label="Style"
                  items={currentStyleChips}
                  activeKey={filters.style}
                  onSelect={setStyle}
                  allLabel="All Styles"
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SortSelect
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={(key) => setSort(key as "newest" | "featured" | "oldest")}
              />
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
      </div>

          {/* Active filters + result count */}
          {(activeFilters.length > 0 || totalCount !== null) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4">
      {/* Cross-link to SEO category page */}
      {activeCategoryData && activeCategoryData.slug !== "free" && (
        <div className="mt-2">
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
      <div className="mt-4">
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
                {filters.contentType === "animations" ? (
                  <ImageGrid variant="animations">
                    {safeResults.map((item: SearchResult) => {
                      const ar = item.aspect_ratio?.replace(":", "/") || "1/1";
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openDrawer(item, safeResults)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDrawer(item, safeResults); }}
                          className="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-gray-200"
                        >
                          <div className="relative" style={{ aspectRatio: ar }}>
                            <VideoPlayer
                              src={item.videoUrl || ""}
                              poster={item.url}
                              mode="preview"
                              className="absolute inset-0"
                            />
                          </div>
                          <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                            <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                            Animated
                          </span>
                        </div>
                      );
                    })}
                  </ImageGrid>
                ) : (
                  <ImageGrid variant={gridVariant}>
                    {safeResults.map((item: SearchResult) => {
                      const ct = item.content_type || gridVariant;
                      const cardVariant =
                        ct === "illustration" ? "illustration" as const
                        : ct === "coloring" ? "coloring" as const
                        : "clipart" as const;
                      return (
                        <ImageCard
                          key={item.id}
                          variant={cardVariant}
                          image={{
                            id: item.id,
                            slug: item.slug,
                            title: item.title,
                            url: item.url,
                            transparent_url: item.transparent_url,
                            category: item.category,
                            style: item.style,
                            content_type: item.content_type,
                            aspect_ratio: item.aspect_ratio,
                          }}
                          onClick={() => openDrawer(item, safeResults)}
                          animationPreviewUrl={item.previewUrl || undefined}
                        />
                      );
                    })}
                  </ImageGrid>
                )}

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
