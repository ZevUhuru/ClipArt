"use client";

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";
import { categories } from "@/data/categories";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { IllustrationMosaicGrid } from "@/components/IllustrationMosaicGrid";
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

const EXPLORE_MENU_LINKS = [
  { href: "/create", label: "Create", description: "Generate new clip art" },
  { href: "/my-art", label: "My Art", description: "Your personal gallery" },
  { href: "/design-bundles", label: "Theme Packs", description: "Download themed collections" },
  { href: "/animate", label: "Animate", description: "Bring your art to life" },
  { href: "/settings", label: "Settings", description: "Account and preferences" },
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

// ── Masonry helpers (shared with AnimationGrid / IllustrationMosaicGrid) ────
function useMasonryColumnCount() {
  const [cols, setCols] = useState(4);
  const update = useCallback(() => {
    const w = window.innerWidth;
    setCols(w < 640 ? 2 : w < 768 ? 3 : 4);
  }, []);
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);
  return cols;
}

function distributeByHeight<T extends { aspect_ratio?: string }>(items: T[], colCount: number): T[][] {
  const columns: T[][] = Array.from({ length: colCount }, () => []);
  const heights = new Array<number>(colCount).fill(0);
  for (const item of items) {
    const [w, h] = (item.aspect_ratio || "1:1").split(":").map(Number);
    const normalizedHeight = (h || 1) / (w || 1);
    const shortestIdx = heights.indexOf(Math.min(...heights));
    columns[shortestIdx].push(item);
    heights[shortestIdx] += normalizedHeight;
  }
  return columns;
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

  const masonryCols = useMasonryColumnCount();

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
  const [menuOpen, setMenuOpen] = useState(false);

  const [coloringCategories, setColoringCategories] = useState<ChipItem[]>([]);
  const [illustrationCategories, setIllustrationCategories] = useState<ChipItem[]>([]);

  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

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

  const animationColumns = useMemo(
    () => filters.contentType === "animations" ? distributeByHeight(safeResults, masonryCols) : [],
    [safeResults, masonryCols, filters.contentType],
  );

  return (
    <div className="overflow-x-hidden pb-8">
      {/* Explore command region — mirrors /create on mobile. */}
      <div className="sticky top-0 z-50 border-b border-gray-900/10 bg-[#1c1c27] shadow-xl shadow-gray-900/10 md:z-20 md:border-0 md:bg-transparent md:shadow-none">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative -mx-4 overflow-hidden px-4 pt-3 pb-3 text-white md:hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-12 -top-16 h-36 w-36 rounded-full bg-pink-500/30 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-14 top-4 h-32 w-32 rounded-full bg-orange-300/20 blur-3xl"
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />

            <div className="relative flex min-h-14 items-center justify-between gap-4">
              <Link
                href="/"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur"
                aria-label="clip.art home"
                title="clip.art home"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-transparent.png" alt="" className="h-7 w-7" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="truncate font-futura text-[24px] font-black leading-tight tracking-tight text-white">
                  Explore
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                className={`relative z-[120] flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 backdrop-blur transition-colors ${
                  menuOpen
                    ? "bg-white text-gray-950 ring-white shadow-lg shadow-black/20"
                    : "bg-white/10 text-white ring-white/15 hover:bg-white/15 active:bg-white/20"
                }`}
              >
                {menuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative mt-3 rounded-2xl bg-white/10 p-1 ring-1 ring-white/12 backdrop-blur">
              <div
                className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="Image type"
              >
                {CONTENT_TABS.map((tab) => {
                  const isActive = filters.contentType === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setContentType(tab.key as ContentType)}
                      className={`relative flex h-11 shrink-0 items-center rounded-xl px-4 text-[14px] font-bold transition-colors ${
                        isActive ? "text-gray-950" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="explore-type-pill"
                          className="absolute inset-0 rounded-xl bg-white shadow-sm"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">
                        {tab.key === "coloring" ? "Coloring" : tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1 right-1 w-10 rounded-r-2xl bg-gradient-to-l from-[#1c1c27] to-transparent"
              />
            </div>

            <AnimatePresence>
              {menuOpen && (
                <ExploreMenuSheet onClose={() => setMenuOpen(false)} />
              )}
            </AnimatePresence>
          </div>

          <div className="pb-4 pt-1 md:py-5">
          <div className="md:overflow-visible md:rounded-[2rem] md:border md:border-white/70 md:bg-white/85 md:p-4 md:shadow-xl md:shadow-gray-200/60 md:ring-1 md:ring-gray-200/60 md:backdrop-blur-xl">
            <div className="mb-3 hidden items-end justify-between gap-4 px-1 md:flex">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-pink-500/70">
                  Discover
                </p>
                <h1 className="font-futura text-2xl font-black tracking-tight text-gray-950">
                  Explore
                </h1>
              </div>
              <p className="max-w-sm text-right text-xs font-medium leading-snug text-gray-400">
                Search the catalog and refine results without leaving the gallery.
              </p>
            </div>
          <div className="relative overflow-visible rounded-2xl bg-white/95 shadow-lg shadow-black/10 ring-1 ring-gray-200/70 md:bg-white md:shadow-md md:shadow-gray-200/60">
            <div className="hidden md:block">
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
                embedded
              />
            </div>

            {/* Filter row */}
            <div className="flex items-center justify-between gap-2 px-2 py-2 md:border-t md:border-gray-200/80">
              <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto md:flex md:overflow-visible">
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

              <div className="flex w-full shrink-0 items-center gap-1.5 md:w-auto">
                <div className="hidden md:block">
                  <SortSelect
                    options={SORT_OPTIONS}
                    value={filters.sort}
                    onChange={(key) => setSort(key as "newest" | "featured" | "oldest")}
                  />
                </div>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 md:hidden"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  Search & Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active filters + result count */}
          {(activeFilters.length > 0 || totalCount !== null) && (
            <div className="flex flex-wrap items-center gap-3 pt-2.5">
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
      </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4">
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
                  // Masonry mosaic — mirrors /animations page
                  <div
                    className="grid gap-2.5"
                    style={{ gridTemplateColumns: `repeat(${masonryCols}, minmax(0, 1fr))` }}
                  >
                    {animationColumns.map((col, ci) => (
                      <div key={ci} className="flex flex-col gap-2.5">
                        {col.map((item) => {
                          const ar = item.aspect_ratio?.replace(":", "/") || "1/1";
                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openDrawer(item, safeResults)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDrawer(item, safeResults); }}
                              className="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-purple-400/40"
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
                      </div>
                    ))}
                  </div>
                ) : filters.contentType === "illustration" ? (
                  // Masonry mosaic — mirrors /illustrations page
                  <IllustrationMosaicGrid
                    items={safeResults.map((r) => ({
                      slug: r.slug,
                      title: r.title,
                      url: r.url,
                      category: r.category,
                      aspect_ratio: r.aspect_ratio,
                      transparent_url: r.transparent_url,
                    }))}
                    onItemClick={(mosaicItem) => {
                      const original = safeResults.find((r) => r.slug === mosaicItem.slug);
                      if (original) openDrawer(original, safeResults);
                    }}
                  />
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
                            has_transparency: item.has_transparency,
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
        searchDefaultValue={filters.query || ""}
        searchPlaceholders={
          filters.contentType === "coloring"
            ? ["Dinosaur coloring page...", "Flowers to color...", "Princess castle..."]
            : filters.contentType === "illustration"
              ? ["Mountain landscape...", "Cozy coffee shop...", "Tropical sunset..."]
              : filters.contentType === "animations"
                ? ["Dancing cat...", "Flying rocket...", "Waving hello..."]
                : ["A happy sun wearing sunglasses...", "Wedding couple...", "Cute cat playing piano...", "Birthday cake with candles..."]
        }
        onSearch={handleSearch}
        sortOptions={SORT_OPTIONS}
        sortValue={filters.sort}
        onSortChange={(key) => setSort(key as "newest" | "featured" | "oldest")}
      />
    </div>
  );
}

function ExploreMenuSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="fixed inset-x-0 bottom-0 z-[100] max-h-[82vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl shadow-black/30"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="sticky top-0 z-10 bg-white px-5 pt-2.5 pb-4">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Navigation
              </p>
              <h2 className="mt-0.5 text-2xl font-black tracking-tight text-gray-950">
                More places
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 pb-4">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            App
          </h2>
          <div className="mt-2 flex flex-col gap-1">
            {EXPLORE_MENU_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm active:bg-gray-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-tight text-gray-900">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-gray-500">
                    {item.description}
                  </span>
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors group-hover:bg-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
