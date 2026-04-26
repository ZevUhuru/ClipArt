"use client";

import { Suspense, useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SearchBar } from "@/components/SearchBar";
import { STYLE_LABELS, VALID_STYLES, type StyleKey } from "@/lib/styles";
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

interface AnimationItem {
  id: string;
  slug: string | null;
  prompt: string;
  model: string;
  duration: number;
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

type ContentFilter = "all" | "clipart" | "illustrations" | "coloring" | "animations" | "shared" | "packs" | "projects";

interface PackItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  item_count: number;
  visibility: "private" | "public";
  is_published: boolean;
  is_free: boolean;
  price_cents: number | null;
  zip_status: "pending" | "building" | "ready" | "failed";
  downloads: number;
  created_at: string;
  updated_at: string;
  categories: { slug: string; name: string } | null;
}

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

interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: "collection" | "short";
  cover_image_url: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const CONTENT_TABS: TabItem[] = [
  { key: "all", label: "All" },
  { key: "clipart", label: "Clip Art" },
  { key: "illustrations", label: "Illustrations" },
  { key: "coloring", label: "Coloring" },
  { key: "animations", label: "Animations" },
  { key: "projects", label: "Projects" },
  { key: "packs", label: "Bundles" },
  { key: "shared", label: "Shared" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

const PAGE_SIZE = 60;

function buildStyleChips(): ChipItem[] {
  const allStyles = new Set<StyleKey>([
    ...VALID_STYLES.clipart,
    ...VALID_STYLES.illustration,
  ]);
  return Array.from(allStyles).map((key) => ({
    key,
    label: STYLE_LABELS[key] || key,
    indicator: <StyleIndicator styleKey={key} />,
  }));
}

const ALL_STYLE_CHIPS = buildStyleChips();

function SignInPrompt() {
  const { openAuthModal } = useAppStore();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-12 text-center">
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
        <p className="mt-4 text-lg font-medium text-gray-500">
          Sign in to view your Library
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Your creations and projects will appear here.
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

// ─── Projects tab ────────────────────────────────────────────────────────────

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"collection" | "short">("collection");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/me/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), project_type: type }),
      });
      const data = await res.json();
      if (data.project) onCreated(data.project);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900">New Project</h2>
        <p className="mt-1 text-sm text-gray-500">
          Collections organise your assets. Shorts are storyboards for animated films.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="My project"
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none ring-0 transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
              Type
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setType("collection")}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  type === "collection"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-semibold">Collection</div>
                <div className="mt-0.5 text-[11px] opacity-70">Folder of assets</div>
              </button>
              <button
                onClick={() => setType("short")}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  type === "short"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-semibold">Short</div>
                <div className="mt-0.5 text-[11px] opacity-70">Storyboard & clips</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create project"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectsView() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/me/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(project: Project) {
    setShowModal(false);
    if (project.project_type === "short") {
      router.push(`/storyboard/${project.id}`);
    } else {
      setProjects((prev) => [project, ...prev]);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <NewProjectModal
            onClose={() => setShowModal(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">No projects yet</p>
          <p className="mt-1 text-xs text-gray-400">Create a collection or start a short film storyboard.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
            Create first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={project.project_type === "short" ? `/storyboard/${project.id}` : `/library/projects/${project.id}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-square bg-gray-100">
                {project.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {project.project_type === "short" ? (
                      <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M18 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125" />
                      </svg>
                    ) : (
                      <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                      </svg>
                    )}
                  </div>
                )}
                <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  project.project_type === "short"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-blue-50 text-blue-600"
                }`}>
                  {project.project_type === "short" ? "Short" : "Collection"}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-gray-900">{project.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {project.item_count} item{project.item_count !== 1 ? "s" : ""} &middot;{" "}
                  {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Main creations grid ──────────────────────────────────────────────────────

function CreationsGrid() {
  const { user } = useAppStore();
  const openDrawer = useImageDrawer((s) => s.open);

  const [items, setItems] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [filter, setFilter] = useState<ContentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filterRef = useRef<ContentFilter>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [sharedUploads, setSharedUploads] = useState<SocialUpload[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [packs, setPacks] = useState<PackItem[]>([]);
  const [packsLoading, setPacksLoading] = useState(false);

  const buildParams = useCallback(
    (contentFilter: ContentFilter, offset: number, q?: string, style?: string | null, sortOpt?: string) => {
      const params = new URLSearchParams({
        filter: contentFilter,
        offset: String(offset),
        limit: String(PAGE_SIZE),
        sort: sortOpt || sort,
      });
      if (q) params.set("q", q);
      if (style) params.set("style", style);
      return params;
    },
    [sort],
  );

  const fetchPage = useCallback(
    async (contentFilter: ContentFilter, offset: number, q?: string, style?: string | null, sortOpt?: string) => {
      if (!user) return [];
      try {
        const params = buildParams(contentFilter, offset, q, style, sortOpt);
        const res = await fetch(`/api/me/images?${params}`);
        if (!res.ok) return { items: [], total: 0 };
        const data = await res.json();
        return { items: (data.images || []) as Generation[], total: data.total as number | undefined };
      } catch {
        return { items: [], total: 0 };
      }
    },
    [user, buildParams],
  );

  const fetchAnimations = useCallback(async (q?: string, sortOpt?: string) => {
    if (!user) return;
    try {
      const params = new URLSearchParams({
        filter: "animations",
        sort: sortOpt || sort,
        limit: String(PAGE_SIZE),
        offset: "0",
      });
      if (q) params.set("q", q);
      const res = await fetch(`/api/me/images?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: AnimationItem[] = (data.animations || []).map((row: any) => {
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

      setAnimations(mapped);
      setTotalCount(data.total ?? mapped.length);
    } catch {
      setAnimations([]);
    }
  }, [user, sort]);

  const loadInitial = useCallback(
    async (contentFilter: ContentFilter, q?: string, style?: string | null, sortOpt?: string) => {
      setIsLoading(true);
      setItems([]);
      setHasMore(false);
      filterRef.current = contentFilter;

      if (contentFilter === "projects") {
        setIsLoading(false);
        return;
      }

      if (contentFilter === "animations") {
        await fetchAnimations(q, sortOpt);
        setIsLoading(false);
        return;
      }

      if (contentFilter === "packs") {
        setPacksLoading(true);
        try {
          const res = await fetch("/api/packs");
          const data = await res.json();
          setPacks(data.packs || []);
          setTotalCount((data.packs || []).length);
        } catch {
          setPacks([]);
          setTotalCount(0);
        } finally {
          setPacksLoading(false);
          setIsLoading(false);
        }
        return;
      }

      if (contentFilter === "shared") {
        setSharedLoading(true);
        try {
          const res = await fetch("/api/me/social/uploads");
          const data = await res.json();
          setSharedUploads(data.uploads || []);
          setTotalCount((data.uploads || []).length);
        } catch {
          setSharedUploads([]);
          setTotalCount(0);
        } finally {
          setSharedLoading(false);
          setIsLoading(false);
        }
        return;
      }

      const result = await fetchPage(contentFilter, 0, q, style, sortOpt);
      if (!result || filterRef.current !== contentFilter) return;

      const { items: newItems, total } = result as { items: Generation[]; total?: number };
      setItems(newItems);
      setHasMore(newItems.length >= PAGE_SIZE);
      if (typeof total === "number") setTotalCount(total);
      setIsLoading(false);
    },
    [fetchPage, fetchAnimations],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const result = await fetchPage(filterRef.current, items.length, searchQuery || undefined, activeStyle);
    if (result) {
      const { items: newItems } = result as { items: Generation[] };
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, items.length, fetchPage, searchQuery, activeStyle]);

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

  useEffect(() => {
    if (user) loadInitial(filter, searchQuery || undefined, activeStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFilterChange = useCallback(
    (next: ContentFilter) => {
      setFilter(next);
      setSearchQuery("");
      setActiveStyle(null);
      loadInitial(next);
    },
    [loadInitial],
  );

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      loadInitial(filter, q || undefined, activeStyle);
    },
    [filter, activeStyle, loadInitial],
  );

  const handleStyleSelect = useCallback(
    (key: string | null) => {
      const next = activeStyle === key ? null : key;
      setActiveStyle(next);
      loadInitial(filter, searchQuery || undefined, next);
    },
    [activeStyle, filter, searchQuery, loadInitial],
  );

  const handleSortChange = useCallback(
    (key: string) => {
      const s = key as "newest" | "oldest";
      setSort(s);
      loadInitial(filter, searchQuery || undefined, activeStyle, s);
    },
    [filter, searchQuery, activeStyle, loadInitial],
  );

  const handleClearAll = useCallback(() => {
    setSearchQuery("");
    setActiveStyle(null);
    setSort("newest");
    loadInitial(filter);
  }, [filter, loadInitial]);

  const showStyleFilter = filter === "all" || filter === "clipart" || filter === "illustrations";
  const showSearchAndSort = filter !== "projects";

  const currentStyleChips = useMemo(() => {
    if (filter === "clipart") {
      return VALID_STYLES.clipart.map((key) => ({
        key,
        label: STYLE_LABELS[key] || key,
        indicator: <StyleIndicator styleKey={key} />,
      }));
    }
    if (filter === "illustrations") {
      return VALID_STYLES.illustration.map((key) => ({
        key,
        label: STYLE_LABELS[key] || key,
        indicator: <StyleIndicator styleKey={key} />,
      }));
    }
    return ALL_STYLE_CHIPS;
  }, [filter]);

  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; type: "category" | "style" | "query" }[] = [];
    if (searchQuery) list.push({ key: "q", label: `"${searchQuery}"`, type: "query" });
    if (activeStyle) {
      list.push({ key: "style", label: STYLE_LABELS[activeStyle as StyleKey] || activeStyle, type: "style" });
    }
    return list;
  }, [searchQuery, activeStyle]);

  const activeFilterCount = (searchQuery ? 1 : 0) + (activeStyle ? 1 : 0);

  const safeItems = items.filter((gen) => gen.id && gen.image_url);
  const useMasonry = filter === "all" || filter === "illustrations";
  const gridVariant = useMasonry
    ? "illustration" as const
    : filter === "coloring"
      ? "coloring" as const
      : "clipart" as const;

  const drawerList = safeItems.map((gen) => ({
    id: gen.id,
    slug: gen.slug || gen.id,
    title: gen.title || gen.prompt,
    url: gen.image_url,
    transparent_url: gen.transparent_image_url ?? undefined,
    category: gen.category || "free",
    style: gen.style,
    content_type: gen.content_type,
    aspect_ratio: gen.aspect_ratio,
    prompt: gen.prompt,
    model: gen.model || undefined,
    has_transparency: gen.has_transparency ?? undefined,
  }));

  return (
    <>
      {/* Search bar — hidden on projects tab */}
      {showSearchAndSort && (
        <SearchBar
          onSearch={handleSearch}
          placeholders={["Search your library...", "Find that sunset illustration...", "Where was that cute cat..."]}
          defaultValue={searchQuery}
        />
      )}

      {/* Toolbar: Tabs + filter popover + sort */}
      <div className={`${showSearchAndSort ? "mt-3" : ""} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <ContentTypeTabs
            tabs={CONTENT_TABS}
            activeKey={filter}
            onSelect={(key) => handleFilterChange(key as ContentFilter)}
            layoutId="library-tab"
          />
          {showStyleFilter && (
            <FilterPopover
              label="Style"
              items={currentStyleChips}
              activeKey={activeStyle}
              onSelect={handleStyleSelect}
              allLabel="All Styles"
            />
          )}
        </div>

        {showSearchAndSort && (
          <div className="flex items-center gap-2">
            <SortSelect
              options={SORT_OPTIONS}
              value={sort}
              onChange={handleSortChange}
            />
            {showStyleFilter && (
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
        )}
      </div>

      {/* Active filters + result count */}
      {showSearchAndSort && (activeFilters.length > 0 || totalCount !== null) && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {activeFilters.length > 0 && (
              <ActiveFilters
                filters={activeFilters}
                onRemove={(type) => {
                  if (type === "query") { setSearchQuery(""); loadInitial(filter, undefined, activeStyle); }
                  if (type === "style") { setActiveStyle(null); loadInitial(filter, searchQuery || undefined, null); }
                }}
                onClearAll={handleClearAll}
              />
            )}
          </AnimatePresence>
          <ResultCount
            total={totalCount}
            isLoading={isLoading}
            contentType={filter === "all" ? undefined : filter === "illustrations" ? "illustration" : filter}
          />
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          {filter === "projects" ? (
            <ProjectsView />
          ) : isLoading ? (
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
                  const thumb = upload.animation?.source?.image_url || upload.animation?.thumbnail_url || null;
                  const uploadTitle = upload.title || upload.animation?.source?.title || upload.animation?.prompt || "Untitled";
                  return (
                    <div
                      key={upload.id}
                      className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      {thumb && (
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{uploadTitle}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                          <span className="font-medium text-gray-500">
                            {PROVIDER_LABELS[upload.provider] || upload.provider}
                          </span>
                          <span>&middot;</span>
                          <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                          <span>&middot;</span>
                          <span className={
                            upload.status === "published" ? "text-emerald-500"
                            : upload.status === "failed" ? "text-red-500"
                            : "text-amber-500"
                          }>
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
              <EmptyState
                icon="share"
                title="No shared animations yet"
                description="Share your animations to YouTube and other platforms to see them here."
              />
            )
          ) : filter === "packs" ? (
            packsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
              </div>
            ) : packs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => {
                  const status = pack.zip_status === "ready" && pack.is_published
                    ? "Published"
                    : pack.zip_status === "building"
                      ? "Building..."
                      : "Draft";
                  const statusColor = status === "Published"
                    ? "text-emerald-600 bg-emerald-50"
                    : status === "Building..."
                      ? "text-amber-600 bg-amber-50"
                      : "text-gray-500 bg-gray-100";

                  return (
                    <Link
                      key={pack.id}
                      href={`/create/packs?id=${pack.id}`}
                      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative aspect-[16/9] bg-gray-100">
                        {pack.cover_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pack.cover_image_url}
                            alt={pack.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute right-2 top-2 flex gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
                            {status}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            pack.visibility === "public" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                          }`}>
                            {pack.visibility === "public" ? "Public" : "Private"}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                          {pack.title}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                          <span>{pack.item_count} item{pack.item_count !== 1 ? "s" : ""}</span>
                          {pack.categories && (
                            <>
                              <span>&middot;</span>
                              <span>{pack.categories.name}</span>
                            </>
                          )}
                          <span>&middot;</span>
                          <span>{new Date(pack.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="image"
                title="No bundles yet"
                description="Create themed bundles of your clip art, coloring pages, and illustrations."
                action={{ label: "Create a Bundle", href: "/create/packs" }}
              />
            )
          ) : filter === "animations" ? (
            animations.length > 0 ? (
              <div className="columns-2 gap-2.5 sm:columns-3 md:columns-4 [&>*]:mb-2.5 [&>*]:break-inside-avoid">
                {animations.map((anim) => {
                  const drawerItem = {
                    id: anim.id,
                    slug: anim.slug || anim.source_slug || anim.id,
                    title: anim.source_title || anim.prompt,
                    url: anim.source_image_url || anim.thumbnail_url || "",
                    category: anim.source_category || "free",
                    style: "animation",
                    aspect_ratio: anim.source_aspect_ratio || undefined,
                    videoUrl: anim.video_url,
                    prompt: anim.prompt,
                    model: anim.model,
                    duration: anim.duration,
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
                    prompt: a.prompt,
                    model: a.model,
                    duration: a.duration,
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
                        <svg className="h-2 w-2" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                        Animated
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="video"
                title={searchQuery ? "No animations match your search" : "No animations yet"}
                description={searchQuery ? "Try a different search term." : "Animate your clip art to see them here."}
                action={!searchQuery ? { label: "Animate an image", href: "/animate" } : undefined}
                onClear={searchQuery ? handleClearAll : undefined}
              />
            )
          ) : safeItems.length > 0 ? (
            <>
              <ImageGrid variant={gridVariant}>
                {safeItems.map((gen) => {
                  const ct = gen.content_type || (gen.style === "coloring" ? "coloring" : "clipart");
                  const variant = ct === "illustration" ? "illustration" as const : ct === "coloring" ? "coloring" as const : "clipart" as const;
                  const cardVariant = useMasonry ? "illustration" as const : variant;

                  return (
                    <ImageCard
                      key={gen.id}
                      image={{
                        id: gen.id,
                        slug: gen.slug || gen.id,
                        title: gen.prompt,
                        url: gen.image_url,
                        transparent_url: gen.transparent_image_url ?? undefined,
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
                          transparent_url: gen.transparent_image_url ?? undefined,
                          category: gen.category || "free",
                          style: gen.style,
                          content_type: gen.content_type,
                          aspect_ratio: gen.aspect_ratio,
                          prompt: gen.prompt,
                          model: gen.model || undefined,
                          has_transparency: gen.has_transparency ?? undefined,
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
            <EmptyState
              icon="image"
              title={
                searchQuery || activeStyle
                  ? "No matching creations"
                  : filter === "coloring" ? "No coloring pages yet"
                  : filter === "illustrations" ? "No illustrations yet"
                  : filter === "clipart" ? "No clip art yet"
                  : "No creations yet"
              }
              description={
                searchQuery || activeStyle
                  ? "Try adjusting your search or filters."
                  : "Your creations will appear here after you generate them."
              }
              onClear={searchQuery || activeStyle ? handleClearAll : undefined}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mobile filter drawer */}
      {showStyleFilter && (
        <FilterDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          categoryItems={[]}
          styleItems={currentStyleChips}
          activeCategory={null}
          activeStyle={activeStyle}
          onCategorySelect={() => {}}
          onStyleSelect={(key) => { handleStyleSelect(key); }}
          onReset={() => { handleClearAll(); setDrawerOpen(false); }}
          showStyles={showStyleFilter}
        />
      )}
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  onClear,
}: {
  icon: "image" | "video" | "share";
  title: string;
  description: string;
  action?: { label: string; href: string };
  onClear?: () => void;
}) {
  const icons = {
    image: (
      <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    video: (
      <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
    share: (
      <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-12 text-center">
      {icons[icon]}
      <p className="mt-4 text-base font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {onClear && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
        {action && (
          <Link href={action.href} className="btn-primary text-sm">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { user } = useAppStore();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-futura text-2xl font-bold text-gray-900">Library</h1>
        {user && (
          <Link href="/create" className="btn-primary text-sm">
            Create new
          </Link>
        )}
      </div>

      {user ? (
        <Suspense>
          <CreationsGrid />
        </Suspense>
      ) : (
        <SignInPrompt />
      )}
    </div>
  );
}
