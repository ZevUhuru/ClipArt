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
  FilterPopover,
  ActiveFilters,
  SortSelect,
  ResultCount,
  FilterDrawer,
  type ChipItem,
} from "@/components/filters";
import { useFilterState } from "@/hooks/useFilterState";

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

const POPULAR_CATEGORY_SLUGS = [
  "christmas",
  "halloween",
  "school",
  "book",
  "cat",
  "dog",
  "flower",
  "heart",
  "sports",
  "food",
  "music",
  "objects",
];

const popularClipartCategories = POPULAR_CATEGORY_SLUGS
  .map((slug) => categories.find((category) => category.slug === slug))
  .filter(Boolean) as typeof categories;

function buildClipartStyleChips(): ChipItem[] {
  return VALID_STYLES.clipart.map((key) => ({
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
    setCategory,
    setStyle,
    setQuery,
    setSort,
    clearFilter,
    clearAll,
    loadMore,
  } = useFilterState({ mode: "public", defaultSort: "newest", lockedContentType: "clipart" });

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

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

  const currentCategoryChips = clipartCategoryChips;
  const currentStyleChips = useMemo(() => buildClipartStyleChips(), []);

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

  const activeCategoryData = filters.category
    ? categories.find((c) => c.slug === filters.category)
    : null;

  const gridVariant = "clipart" as const;

  const handleSearch = useCallback((q: string) => setQuery(q), [setQuery]);

  const safeResults = results.filter((item) => item.id && (item.url || item.videoUrl));

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
                  Explore Clip Art
                </div>
                <p className="truncate text-xs font-semibold text-white/45">
                  Find free transparent PNGs faster.
                </p>
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

            <AnimatePresence>
              {menuOpen && (
                <ExploreMenuSheet onClose={() => setMenuOpen(false)} />
              )}
            </AnimatePresence>
          </div>

          <div className="pb-4 pt-3 md:py-5">
          <div className="md:overflow-visible md:rounded-[2rem] md:border md:border-white/70 md:bg-white/85 md:p-4 md:shadow-xl md:shadow-gray-200/60 md:ring-1 md:ring-gray-200/60 md:backdrop-blur-xl">
            <div className="mb-3 hidden items-end justify-between gap-4 px-1 md:flex">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-pink-500/70">
                  Discover
                </p>
                <h1 className="font-futura text-2xl font-black tracking-tight text-gray-950">
                  Explore Clip Art
                </h1>
              </div>
              <p className="max-w-sm text-right text-xs font-medium leading-snug text-gray-400">
                Search free transparent clip art by theme, style, or use case.
              </p>
            </div>
          <div className="relative overflow-visible rounded-2xl bg-white/95 shadow-lg shadow-black/10 ring-1 ring-gray-200/70 md:bg-white md:shadow-md md:shadow-gray-200/60">
            <div className="hidden md:block">
              <SearchBar
                onSearch={handleSearch}
                placeholders={["Birthday cake with candles...", "Teacher apple...", "Soccer ball...", "Christmas tree...", "Cute cat playing piano..."]}
                defaultValue={filters.query || ""}
                embedded
              />
            </div>

            {/* Filter row */}
            <div className="flex items-center justify-between gap-2 px-2 py-2 md:border-t md:border-gray-200/80">
              <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto md:flex md:overflow-visible">
                <FilterPopover
                  label="Category"
                  items={currentCategoryChips}
                  activeKey={filters.category}
                  onSelect={setCategory}
                  allLabel="All Categories"
                />
                <FilterPopover
                  label="Style"
                  items={currentStyleChips}
                  activeKey={filters.style}
                  onSelect={setStyle}
                  allLabel="All Styles"
                />
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

          <div className="pt-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45 md:text-gray-400">
                Popular
              </span>
              {popularClipartCategories.map((category) => {
                const isActive = filters.category === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => setCategory(category.slug)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "border border-white/10 bg-white/10 text-white/75 hover:bg-white/15 hover:text-white md:border-gray-200 md:bg-white/80 md:text-gray-500 md:hover:border-gray-300 md:hover:bg-white md:hover:text-gray-900"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
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
                <ImageGrid variant={gridVariant}>
                  {safeResults.map((item: SearchResult) => (
                    <ImageCard
                      key={item.id}
                      variant="clipart"
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
                  No clip art found
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Try a different search term, category, or style.
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
        showStyles
        searchDefaultValue={filters.query || ""}
        searchPlaceholders={["Birthday cake with candles...", "Teacher apple...", "Soccer ball...", "Christmas tree...", "Cute cat playing piano..."]}
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
