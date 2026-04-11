"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type ContentType = "clipart" | "illustration" | "coloring" | "animations";
export type SortOption = "newest" | "featured" | "oldest";

export interface FilterState {
  contentType: ContentType;
  category: string | null;
  style: string | null;
  query: string | null;
  sort: SortOption;
}

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  style: string;
  content_type?: string;
  aspect_ratio?: string;
  videoUrl?: string;
  previewUrl?: string;
  model?: string;
  duration?: number;
}

interface UseFilterStateOptions {
  mode?: "public" | "private";
  pageSize?: number;
  defaultSort?: SortOption;
  defaultContentType?: ContentType;
  syncUrl?: boolean;
}

const PAGE_SIZE_DEFAULT = 60;

function filtersToParams(f: FilterState, mode: "public" | "private"): URLSearchParams {
  const params = new URLSearchParams();
  if (mode === "public") {
    params.set("content_type", f.contentType);
    params.set("browse", "1");
  } else {
    const filterMap: Record<ContentType, string> = {
      clipart: "clipart",
      illustration: "illustrations",
      coloring: "coloring",
      animations: "animations",
    };
    params.set("filter", filterMap[f.contentType] || "all");
  }
  if (f.query) params.set("q", f.query);
  if (f.category && f.contentType !== "animations") params.set("category", f.category);
  if (f.style && f.contentType !== "coloring" && f.contentType !== "animations") {
    params.set("style", f.style);
  }
  if (f.sort !== "newest") params.set("sort", f.sort);
  return params;
}

function filtersToUrl(f: FilterState): string {
  const sp = new URLSearchParams();
  if (f.contentType !== "clipart") sp.set("type", f.contentType);
  if (f.contentType !== "animations") {
    if (f.category) sp.set("category", f.category);
    if (f.style) sp.set("style", f.style);
  }
  if (f.query) sp.set("q", f.query);
  if (f.sort !== "newest") sp.set("sort", f.sort);
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function useFilterState(options: UseFilterStateOptions = {}) {
  const {
    mode = "public",
    pageSize = PAGE_SIZE_DEFAULT,
    defaultSort = "newest",
    defaultContentType = "clipart",
    syncUrl = true,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  const rawType = searchParams.get("type");
  const initialCt: ContentType =
    rawType === "coloring" ? "coloring"
    : rawType === "illustration" ? "illustration"
    : rawType === "animations" ? "animations"
    : defaultContentType;

  const [filters, setFilters] = useState<FilterState>({
    contentType: initialCt,
    category: searchParams.get("category") || null,
    style: searchParams.get("style") || null,
    query: searchParams.get("q") || null,
    sort: (searchParams.get("sort") as SortOption) || defaultSort,
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const mountedRef = useRef(false);

  const fetchResults = useCallback(
    async (f: FilterState, offset = 0) => {
      const endpoint = mode === "private" ? "/api/me/images" : "/api/search";
      const params = filtersToParams(f, mode);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const isFirstPage = offset === 0;
      if (isFirstPage) {
        setIsLoading(true);
        setResults([]);
      } else {
        setIsLoadingMore(true);
      }
      setHasSearched(true);

      try {
        const res = await fetch(`${endpoint}?${params.toString()}`);
        const data = await res.json();

        let newResults: SearchResult[];
        if (mode === "private" && f.contentType === "animations") {
          newResults = (data.animations || []).map((a: Record<string, unknown>) => {
            const source = a.source as Record<string, string> | null;
            return {
              id: a.id as string,
              slug: (a.slug as string) || (a.id as string),
              title: source?.title || (a.prompt as string),
              url: source?.image_url || (a.thumbnail_url as string) || "",
              description: a.prompt as string,
              category: source?.category || "free",
              style: "animation",
              videoUrl: a.video_url as string,
              previewUrl: a.preview_url as string,
              model: a.model as string | undefined,
              duration: a.duration as number | undefined,
            };
          });
        } else if (mode === "private") {
          newResults = (data.images || []).map((g: Record<string, string>) => ({
            id: g.id,
            slug: g.slug || g.id,
            title: g.title || g.prompt,
            url: g.image_url,
            description: g.prompt,
            category: g.category || "free",
            style: g.style,
            content_type: g.content_type,
            model: g.model || undefined,
          }));
        } else {
          newResults = (data.results || []).map((r: SearchResult) => ({
            ...r,
            content_type: r.content_type || f.contentType,
          }));
        }

        if (isFirstPage) {
          setResults(newResults);
        } else {
          setResults((prev) => [...prev, ...newResults]);
        }
        setHasMore(newResults.length >= pageSize);
        if (typeof data.total === "number") setTotalCount(data.total);
      } catch {
        if (isFirstPage) setResults([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [mode, pageSize],
  );

  const updateFiltersAndFetch = useCallback(
    (next: FilterState) => {
      setFilters(next);
      fetchResults(next);
      if (syncUrl && mode === "public") {
        router.replace(filtersToUrl(next), { scroll: false });
      }
    },
    [fetchResults, router, syncUrl, mode],
  );

  const setContentType = useCallback(
    (ct: ContentType) => {
      updateFiltersAndFetch({
        ...filtersRef.current,
        contentType: ct,
        category: null,
        style: null,
        query: null,
        sort: filtersRef.current.sort,
      });
    },
    [updateFiltersAndFetch],
  );

  const setCategory = useCallback(
    (slug: string | null) => {
      const next = filtersRef.current.category === slug ? null : slug;
      updateFiltersAndFetch({
        ...filtersRef.current,
        category: next,
        query: null,
      });
    },
    [updateFiltersAndFetch],
  );

  const setStyle = useCallback(
    (key: string | null) => {
      const next = filtersRef.current.style === key ? null : key;
      updateFiltersAndFetch({
        ...filtersRef.current,
        style: next,
        query: null,
      });
    },
    [updateFiltersAndFetch],
  );

  const setQuery = useCallback(
    (q: string) => {
      if (!q.trim()) {
        updateFiltersAndFetch({
          ...filtersRef.current,
          query: null,
          category: null,
          style: null,
        });
        return;
      }
      updateFiltersAndFetch({
        ...filtersRef.current,
        query: q,
        category: null,
        style: null,
      });
    },
    [updateFiltersAndFetch],
  );

  const setSort = useCallback(
    (sort: SortOption) => {
      updateFiltersAndFetch({ ...filtersRef.current, sort });
    },
    [updateFiltersAndFetch],
  );

  const clearFilter = useCallback(
    (key: "category" | "style" | "query") => {
      updateFiltersAndFetch({ ...filtersRef.current, [key]: null });
    },
    [updateFiltersAndFetch],
  );

  const clearAll = useCallback(() => {
    updateFiltersAndFetch({
      contentType: filtersRef.current.contentType,
      category: null,
      style: null,
      query: null,
      sort: defaultSort,
    });
  }, [updateFiltersAndFetch, defaultSort]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchResults(filtersRef.current, results.length);
  }, [isLoadingMore, hasMore, results.length, fetchResults]);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.style ? 1 : 0) +
    (filters.query ? 1 : 0);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    fetchResults(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
  };
}
