"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAppStore } from "@/stores/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Generation {
  id: string;
  title: string | null;
  slug: string | null;
  prompt: string;
  image_url: string;
  transparent_image_url?: string | null;
  has_transparency?: boolean;
  style: string;
  content_type: string;
  category: string | null;
}

interface PackItem {
  id: string;
  generation_id: string;
  is_exclusive: boolean;
  sort_order: number;
  generations: Generation;
}

interface Pack {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  tags: string[];
  visibility: string;
  cover_image_url: string | null;
  cover_generation_id?: string | null;
  is_published: boolean;
  zip_status: string;
  item_count: number;
  pack_items?: PackItem[];
  categories?: { slug: string; name: string } | null;
}

type EditorView = "editor" | "library" | "browse" | "generate";

const PACK_AUDIENCES = [
  "Teachers and classrooms",
  "Etsy and craft shops",
  "Small business marketing",
  "Parties and events",
  "AI video creators",
  "Sticker makers",
];

const PACK_GOALS = [
  "Classroom decor",
  "Sticker sheet",
  "Invitation set",
  "Seasonal campaign",
  "Product mockup",
  "Character sheet",
];

const STARTER_PACKS = [
  {
    title: "Spring Garden Clip Art Pack",
    description:
      "A cohesive transparent clip art pack with flowers, butterflies, garden tools, borders, and seasonal accents for classroom printables, crafts, and shop listings.",
    tags: "spring, flowers, garden, butterfly, cricut",
    audience: "Etsy and craft shops",
    goal: "Sticker sheet",
  },
  {
    title: "Classroom Rewards Clip Art Pack",
    description:
      "Reusable school-themed clip art for teachers making reward charts, worksheets, bulletin boards, classroom labels, and student activity pages.",
    tags: "school, teacher, classroom, rewards, education",
    audience: "Teachers and classrooms",
    goal: "Classroom decor",
  },
  {
    title: "Consistent Character Sheet Pack",
    description:
      "A character-focused clip art pack with coordinated poses, expressions, angles, and reusable character moments for AI video creators and story assets.",
    tags: "character, poses, expressions, ai video, mascot",
    audience: "AI video creators",
    goal: "Character sheet",
  },
];

const STUDIO_PROMISES = [
  "Start with a product idea, not a blank upload form.",
  "Generate new clipart directly into the pack.",
  "Import your existing library assets when they fit.",
  "Pick a cover and publish a ZIP-ready theme pack.",
];

const STUDIO_WORKFLOW = [
  { label: "Brief", detail: "Define the buyer and use case." },
  { label: "Assets", detail: "Generate or import cohesive clipart." },
  { label: "Cover", detail: "Pick the image that sells the set." },
  { label: "Publish", detail: "Prepare the ZIP-ready pack." },
];

export default function CreatePacksPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
          </div>
        </div>
      }
    >
      <CreatePacksPage />
    </Suspense>
  );
}

function CreatePacksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAppStore();

  const [pack, setPack] = useState<Pack | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("public");
  const [audience, setAudience] = useState(PACK_AUDIENCES[0]);
  const [packGoal, setPackGoal] = useState(PACK_GOALS[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentPacks, setRecentPacks] = useState<Pack[]>([]);
  const [items, setItems] = useState<PackItem[]>([]);
  const [coverItemId, setCoverItemId] = useState<string | null>(null);

  const [view, setView] = useState<EditorView>("editor");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<Generation[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Generation[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());

  const [genPrompt, setGenPrompt] = useState("");
  const [genCount, setGenCount] = useState(5);
  const [genStyle, setGenStyle] = useState("flat");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showMetadata, setShowMetadata] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        const packCats = (d.categories || []).filter(
          (c: Category & { type: string }) => c.type === "pack",
        );
        setCategories(packCats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const packId = searchParams.get("id");
    if (!packId || !user || pack) return;
    setLoadingExisting(true);
    fetch(`/api/packs/${packId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load pack");
        return r.json();
      })
      .then((data) => {
        const loaded = data.pack as Pack;
        if (!loaded) return;
        setPack(loaded);
        setTitle(loaded.title);
        setDescription(loaded.description || "");
        setCategoryId(loaded.category_id || "");
        setTags((loaded.tags || []).join(", "));
        setVisibility(loaded.visibility === "public" ? "public" : "private");
        setCoverItemId(loaded.cover_generation_id || null);
        if (loaded.pack_items?.length) {
          const sorted = [...loaded.pack_items].sort(
            (a, b) => a.sort_order - b.sort_order,
          );
          setItems(sorted);
        }
      })
      .catch(() => {
        setError("Could not load that pack. It may not exist or you don\u2019t have access.");
      })
      .finally(() => setLoadingExisting(false));
  }, [searchParams, user, pack]);

  const createPack = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          visibility,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPack(data.pack);
      router.replace(`/create/packs?id=${data.pack.id}`, { scroll: false });
      setSuccessMsg("Pack created!");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pack");
    } finally {
      setSaving(false);
    }
  }, [title, description, categoryId, tags, visibility, router]);

  useEffect(() => {
    if (!user || searchParams.get("id")) return;
    fetch("/api/packs")
      .then((r) => (r.ok ? r.json() : { packs: [] }))
      .then((data) => setRecentPacks(data.packs || []))
      .catch(() => setRecentPacks([]));
  }, [user, searchParams]);

  const updatePack = useCallback(async () => {
    if (!pack) return;
    try {
      await fetch(`/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          visibility,
        }),
      });
    } catch {
      // silent auto-save failure
    }
  }, [pack, title, description, categoryId, tags, visibility]);

  const autoSave = useCallback(() => {
    if (!pack) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(updatePack, 1500);
  }, [pack, updatePack]);

  useEffect(() => {
    autoSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, description, categoryId, tags, visibility, autoSave]);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams({
        filter: "clipart",
        limit: "60",
        sort: "newest",
      });
      if (libraryQuery.trim()) params.set("q", libraryQuery.trim());
      const res = await fetch(`/api/me/images?${params.toString()}`);
      const data = await res.json();
      setLibraryResults(data.images || []);
    } catch {
      setLibraryResults([]);
    } finally {
      setLibraryLoading(false);
    }
  }, [libraryQuery]);

  useEffect(() => {
    if (view === "library" && libraryResults.length === 0) {
      loadLibrary();
    }
  }, [view, libraryResults.length, loadLibrary]);

  const searchAssets = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}&content_type=clipart&limit=40`,
      );
      const data = await res.json();
      const results = (data.results || data.images || []).map(
        (result: Generation & { url?: string; transparent_url?: string }) => ({
          ...result,
          image_url: result.image_url || result.url || "",
          transparent_image_url: result.transparent_image_url || result.transparent_url || null,
        }),
      );
      setSearchResults(results.filter((result: Generation) => result.image_url));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const batchGenerate = useCallback(async () => {
    if (!pack || !genPrompt.trim()) return;
    setGenerating(true);
    setGenProgress(`Generating ${genCount} items...`);
    setError(null);
    try {
      const ideaList = genPrompt
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(", ");
      const packContext = [
        `Create transparent PNG clip art for a cohesive pack titled "${title.trim() || pack.title}"`,
        description.trim() ? `Pack description: ${description.trim()}` : null,
        `Audience: ${audience}`,
        `Use case: ${packGoal}`,
        tags.trim() ? `Theme tags: ${tags.trim()}` : null,
        `Asset ideas: ${ideaList}`,
        "Keep the assets visually consistent, reusable, isolated on a transparent or white-safe background, and suitable for a commercial clip art bundle.",
      ]
        .filter(Boolean)
        .join(". ");

      const res = await fetch("/api/generate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: packContext,
          style: genStyle,
          count: genCount,
          contentType: "clipart",
          pack_id: pack.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.results?.length > 0) {
        const res2 = await fetch(`/api/packs/${pack.id}`, {
          headers: { "Content-Type": "application/json" },
        });
        const packData = await res2.json();
        if (packData.pack?.pack_items) {
          const sortedItems = packData.pack.pack_items.sort(
            (a: PackItem, b: PackItem) => a.sort_order - b.sort_order,
          );
          setItems(sortedItems);
        }
        setSuccessMsg(`Generated ${data.results.length} items (${data.credits_used} credits used)`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
      setGenPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch generation failed");
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  }, [pack, genPrompt, genStyle, genCount, title, description, audience, packGoal, tags]);

  const itemGenerationIds = new Set(items.map((i) => i.generation_id));

  const addItems = useCallback(
    async (generationIds: string[]) => {
      if (!pack) return;
      try {
        const res = await fetch(`/api/packs/${pack.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generation_ids: generationIds }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const newItems = data.items || [];
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.generation_id));
          const filtered = newItems.filter(
            (ni: PackItem) => !existingIds.has(ni.generation_id),
          );
          return [...prev, ...filtered];
        });
        setSuccessMsg(`Added ${newItems.length} item(s)`);
        setTimeout(() => setSuccessMsg(null), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add items");
      }
    },
    [pack],
  );

  const toggleSelectedLibrary = useCallback((id: string) => {
    setSelectedLibraryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectedCatalog = useCallback((id: string) => {
    setSelectedCatalogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addSelectedLibraryItems = useCallback(async () => {
    const ids = Array.from(selectedLibraryIds).filter((id) => !itemGenerationIds.has(id));
    if (ids.length === 0) return;
    await addItems(ids);
    setSelectedLibraryIds(new Set());
  }, [addItems, selectedLibraryIds, itemGenerationIds]);

  const addSelectedCatalogItems = useCallback(async () => {
    const ids = Array.from(selectedCatalogIds).filter((id) => !itemGenerationIds.has(id));
    if (ids.length === 0) return;
    await addItems(ids);
    setSelectedCatalogIds(new Set());
  }, [addItems, selectedCatalogIds, itemGenerationIds]);

  const setPackCover = useCallback(
    async (item: PackItem) => {
      if (!pack) return;
      setCoverItemId(item.generation_id);
      try {
        const coverUrl = item.generations.transparent_image_url || item.generations.image_url;
        const res = await fetch(`/api/packs/${pack.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cover_generation_id: item.generation_id,
            cover_image_url: coverUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPack((prev) =>
          prev
            ? {
                ...prev,
                cover_generation_id: item.generation_id,
                cover_image_url: coverUrl,
              }
            : null,
        );
        setSuccessMsg("Cover saved");
        setTimeout(() => setSuccessMsg(null), 1800);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save cover");
      }
    },
    [pack],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!pack) return;
      try {
        await fetch(`/api/packs/${pack.id}/items`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_ids: [itemId] }),
        });
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } catch {
        setError("Failed to remove item");
      }
    },
    [pack],
  );

  const publishPack = useCallback(async () => {
    if (!pack || items.length === 0) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${pack.id}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPack((prev) =>
        prev
          ? {
              ...prev,
              is_published: true,
              zip_status: data.zip_status || "ready",
              item_count: data.item_count || items.length,
            }
          : null,
      );
      setSuccessMsg("Pack published! ZIP is ready.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [pack, items]);

  const moveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      const newItems = [...items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newItems.length) return;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setItems(newItems);

      if (pack) {
        fetch(`/api/packs/${pack.id}/items/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newItems.map((i) => i.id) }),
        }).catch(() => {});
      }
    },
    [items, pack],
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(236,72,153,0.12),transparent_34%),#fff]">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Create a Clipart Pack</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign up to create themed packs of reusable transparent clip art.
          </p>
          <button
            onClick={() => openAuthModal("signup")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110"
          >
            Sign up — it&apos;s free
          </button>
        </div>
      </div>
    );
  }

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
          <span className="ml-3 text-sm text-gray-500">Loading pack...</span>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(251,146,60,0.12),transparent_28%),linear-gradient(180deg,#fff_0%,#fafafa_58%,#fff_100%)] pb-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="pt-4 sm:pt-8">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-pink-500">
                Clipart Pack Studio
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                Build a clipart pack people instantly understand.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
                Start with a theme, audience, and use case. Then generate matching transparent
                clip art, import your best library assets, choose a cover, and publish a ZIP-ready
                pack from one workspace.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {STUDIO_PROMISES.map((promise) => (
                  <div
                    key={promise}
                    className="rounded-2xl border border-white/80 bg-white/75 p-4 text-sm font-semibold text-gray-700 shadow-lg shadow-gray-100/60 backdrop-blur"
                  >
                    {promise}
                  </div>
                ))}
              </div>

              {recentPacks.length > 0 && (
                <div className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white/80 p-4 shadow-xl shadow-gray-100/70 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-black text-gray-950">Continue a pack</h2>
                    <span className="text-xs font-semibold text-gray-400">
                      {recentPacks.length} drafts
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {recentPacks.slice(0, 3).map((recentPack) => (
                      <button
                        key={recentPack.id}
                        onClick={() => router.push(`/create/packs?id=${recentPack.id}`)}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-pink-200 hover:shadow-md"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {recentPack.cover_image_url ? (
                            <Image
                              src={recentPack.cover_image_url}
                              alt={`${recentPack.title} cover`}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {recentPack.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {recentPack.item_count || 0} assets
                            {recentPack.is_published ? " · Published" : " · Draft"}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-pink-500">Open</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-pink-100/50 ring-1 ring-gray-100 backdrop-blur sm:p-6">
              <div className="rounded-[1.5rem] bg-gray-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-300">
                  New Pack
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Define the product before the images.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  A strong pack has a buyer, a job, a consistent style, and enough related assets
                  to feel complete.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Pack Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Spring Garden Clip Art Pack"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && title.trim()) createPack();
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Audience
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    >
                      {PACK_AUDIENCES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Pack Goal
                    </label>
                    <select
                      value={packGoal}
                      onChange={(e) => setPackGoal(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    >
                      {PACK_GOALS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="What is in this pack, and what can customers make with it?"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="spring, flowers, garden, cricut"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div className="rounded-[1.25rem] bg-pink-50/70 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-pink-500">
                    Starter Ideas
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STARTER_PACKS.map((starter) => (
                      <button
                        key={starter.title}
                        type="button"
                        onClick={() => {
                          setTitle(starter.title);
                          setDescription(starter.description);
                          setTags(starter.tags);
                          setAudience(starter.audience);
                          setPackGoal(starter.goal);
                        }}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-950 hover:text-white"
                      >
                        {starter.title.replace(" Clip Art Pack", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={createPack}
                  disabled={!title.trim() || saving}
                  className="w-full rounded-2xl bg-brand-gradient px-5 py-3.5 text-sm font-black text-white shadow-xl shadow-pink-100 transition-all hover:shadow-2xl hover:brightness-105 disabled:opacity-50"
                >
                  {saving ? "Creating Pack..." : "Create Pack Studio"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const coverItem =
    items.find((item) => item.generation_id === coverItemId) || items[0] || null;
  const currentCoverUrl =
    pack?.cover_image_url ||
    coverItem?.generations.transparent_image_url ||
    coverItem?.generations.image_url ||
    null;
  const transparentCount = items.filter(
    (item) => item.generations.has_transparency || item.generations.transparent_image_url,
  ).length;
  const checklist = [
    { label: "Title", complete: Boolean(title.trim()) },
    { label: "Description", complete: description.trim().length >= 40 },
    { label: "Category", complete: Boolean(categoryId) },
    { label: "Tags", complete: tags.split(",").map((t) => t.trim()).filter(Boolean).length >= 3 },
    { label: "Cover", complete: Boolean(coverItemId || pack?.cover_generation_id || items.length > 0) },
    { label: "At least 8 assets", complete: items.length >= 8 },
    { label: "Clipart only", complete: items.every((item) => item.generations.content_type === "clipart") },
    {
      label: "Transparent-ready assets",
      complete: items.length > 0 && transparentCount >= Math.ceil(items.length * 0.8),
    },
  ];
  const completeChecklistCount = checklist.filter((item) => item.complete).length;
  const canPublish = Boolean(pack && items.length > 0 && title.trim());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_85%_4%,rgba(251,146,60,0.10),transparent_28%),linear-gradient(180deg,#fff_0%,#fafafa_55%,#fff_100%)] pb-32">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}
          {successMsg && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600"
            >
              {successMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {pack && (
          <>
            <section className="mb-6 overflow-hidden rounded-[2rem] bg-gray-950 shadow-2xl shadow-gray-200/80">
              <div className="relative grid gap-6 p-5 text-white sm:p-7 lg:grid-cols-[1fr_360px] lg:items-center">
                <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pink-500/25 blur-3xl" />
                <div aria-hidden className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-orange-400/15 blur-3xl" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.26em] text-pink-300">
                    Clipart Pack Studio
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                      {title || pack.title}
                    </h1>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70 ring-1 ring-white/10">
                      {items.length} assets
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70 ring-1 ring-white/10">
                      {completeChecklistCount}/{checklist.length} ready
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55 sm:text-base">
                    Build a cohesive transparent clipart pack for {audience.toLowerCase()}.
                    Use this workspace to shape the brief, create matching assets, set the cover,
                    and prepare the pack for download or sale.
                  </p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-4">
                    {STUDIO_WORKFLOW.map((step, index) => (
                      <div
                        key={step.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-gray-950">
                            {index + 1}
                          </span>
                          <p className="text-sm font-black">{step.label}</p>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-white/45">{step.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                    Next Best Action
                  </p>
                  <h2 className="mt-2 text-xl font-black">
                    {items.length === 0 ? "Add the first 8-12 assets" : "Choose a strong cover"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {items.length === 0
                      ? "Generate a coordinated starter set, then import any library pieces that match the style."
                      : "The cover is what makes the pack feel valuable in listings and search results."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setView("generate")}
                      className="rounded-full bg-white px-4 py-2 text-sm font-black text-gray-950 transition hover:bg-gray-100"
                    >
                      Generate Assets
                    </button>
                    <button
                      onClick={() => setView("library")}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10"
                    >
                      Import Library
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
              <aside className="space-y-5 lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-xl shadow-gray-100/70">
                  <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_30%_15%,rgba(236,72,153,0.18),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(251,146,60,0.16),transparent_30%),#f8fafc]">
                    {currentCoverUrl ? (
                      <Image
                        src={currentCoverUrl}
                        alt={`${title || pack.title} pack cover preview`}
                        fill
                        className="object-cover"
                        sizes="360px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6">
                        <div className="grid w-full max-w-[260px] grid-cols-3 gap-2 opacity-80">
                          {["bg-pink-100", "bg-orange-100", "bg-yellow-100", "bg-rose-100", "bg-fuchsia-100", "bg-amber-100"].map((color, index) => (
                            <div
                              key={`${color}-${index}`}
                              className={`aspect-square rounded-2xl ${color} shadow-sm ring-1 ring-white/80`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-700 shadow-sm">
                      Cover
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">
                      Product Brief
                    </p>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-gray-950">
                      {title || "Untitled Clipart Pack"}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {description ||
                        "Describe who this pack is for and what a buyer can make with it."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                        {audience}
                      </span>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                        {packGoal}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="font-bold text-gray-900">{items.length}</p>
                        <p className="mt-0.5 text-gray-500">Assets</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="font-bold text-gray-900">{transparentCount}</p>
                        <p className="mt-0.5 text-gray-500">Transparent</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-xl shadow-gray-100/70">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Publish Readiness
                      </p>
                      <h3 className="mt-1 text-lg font-black text-gray-950">
                        {completeChecklistCount}/{checklist.length} ready
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        pack.zip_status === "ready"
                          ? "bg-green-50 text-green-700"
                          : pack.zip_status === "building"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pack.zip_status === "ready"
                        ? "ZIP ready"
                        : pack.zip_status === "building"
                          ? "Building"
                          : "Draft"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {checklist.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                            item.complete
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {item.complete ? "✓" : "•"}
                        </span>
                        <span className={item.complete ? "text-gray-700" : "text-gray-400"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-gray-400">
                    You can publish with fewer than eight assets, but strong packs usually feel
                    more valuable when they include a complete reusable set.
                  </p>
                </div>
              </aside>

              <section className="min-w-0">
            {/* Metadata section */}
            <div className="mb-6 rounded-[1.75rem] border border-gray-100 bg-white shadow-xl shadow-gray-100/60">
              <button
                onClick={() => setShowMetadata((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span>
                  <span className="block text-sm font-black text-gray-900">Pack Brief</span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    This is the product definition that guides generation and publishing.
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${showMetadata ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showMetadata && (
                <div className="border-t border-gray-50 px-5 pb-5">
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        <option value="">Select category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe what's in this pack and what customers can make with it..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="spring, flowers, garden, cricut"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Visibility</label>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setVisibility("public")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                            visibility === "public"
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          Public
                        </button>
                        <button
                          onClick={() => setVisibility("private")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                            visibility === "private"
                              ? "bg-gray-200 text-gray-700 ring-1 ring-gray-300"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          Private
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Audience
                      </label>
                      <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        {PACK_AUDIENCES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Pack Goal
                      </label>
                      <select
                        value={packGoal}
                        onChange={(e) => setPackGoal(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        {PACK_GOALS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="mb-4 rounded-[1.5rem] border border-gray-100 bg-white p-2 shadow-lg shadow-gray-100/60">
              <div className="grid gap-2 md:grid-cols-4">
              <button
                onClick={() => setView("editor")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors ${
                  view === "editor"
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Canvas
                <span className="mt-0.5 block text-xs font-medium opacity-60">{items.length} assets</span>
              </button>
              <button
                onClick={() => setView("library")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors ${
                  view === "library"
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Library
                <span className="mt-0.5 block text-xs font-medium opacity-60">Your clipart</span>
              </button>
              <button
                onClick={() => setView("browse")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors ${
                  view === "browse"
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Catalog
                <span className="mt-0.5 block text-xs font-medium opacity-60">Public assets</span>
              </button>
              <button
                onClick={() => setView("generate")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors ${
                  view === "generate"
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Generate
                <span className="mt-0.5 block text-xs font-medium opacity-60">Pack-aware</span>
              </button>
              </div>
            </div>

            {/* Editor view — items grid */}
            {view === "editor" && (
              <>
                {items.length === 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-gray-100/70">
                    <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
                      <div className="p-7 sm:p-10">
                        <div className="inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-pink-500">
                          Empty Canvas
                        </div>
                        <h3 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-gray-950">
                          Start with a coordinated set, not random singles.
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
                          Generate a first batch around this pack brief, then import your best
                          existing clipart if it matches the same style and purpose.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            onClick={() => setView("generate")}
                            className="rounded-full bg-brand-gradient px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-100 hover:shadow-xl"
                          >
                            Generate Starter Set
                          </button>
                          <button
                            onClick={() => setView("library")}
                            className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-800 shadow-sm hover:bg-gray-50"
                          >
                            Import From Library
                          </button>
                        </div>
                        <div className="mt-7 grid gap-2 sm:grid-cols-3">
                          {["8-12 core objects", "Matching style", "Transparent PNGs"].map((tip) => (
                            <div key={tip} className="rounded-2xl bg-gray-50 p-3 text-xs font-bold text-gray-600">
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative min-h-[260px] bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.18),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(251,146,60,0.18),transparent_30%),#f8fafc] p-6">
                        <div className="grid h-full grid-cols-2 gap-3">
                          {["bg-pink-100", "bg-orange-100", "bg-yellow-100", "bg-rose-100"].map((color, index) => (
                            <div
                              key={`${color}-${index}`}
                              className={`rounded-[1.5rem] ${color} shadow-sm ring-1 ring-white/80`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`group relative overflow-hidden rounded-xl border bg-white transition-all ${
                          coverItemId === item.generation_id || (!coverItemId && index === 0)
                            ? "border-pink-300 ring-2 ring-pink-100"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={item.generations.transparent_image_url || item.generations.image_url}
                            alt={item.generations.title || item.generations.prompt}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 640px) 50vw, 20vw"
                          />

                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />

                          <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            {index > 0 && (
                              <button
                                onClick={() => moveItem(index, "up")}
                                className="rounded-md bg-white/90 p-1 text-gray-600 shadow-sm hover:bg-white"
                                title="Move up"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            )}
                            {index < items.length - 1 && (
                              <button
                                onClick={() => moveItem(index, "down")}
                                className="rounded-md bg-white/90 p-1 text-gray-600 shadow-sm hover:bg-white"
                                title="Move down"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="rounded-md bg-red-500/90 p-1 text-white shadow-sm hover:bg-red-600"
                              title="Remove"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {(coverItemId === item.generation_id || (!coverItemId && index === 0)) && (
                            <div className="absolute bottom-1 left-1">
                              <span className="rounded-md bg-pink-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                Cover
                              </span>
                            </div>
                          )}
                          {(item.generations.has_transparency || item.generations.transparent_image_url) && (
                            <div className="absolute left-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-700 shadow-sm">
                              PNG
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setPackCover(item)}
                          className="w-full truncate border-t border-gray-50 px-2 py-1.5 text-left text-[11px] text-gray-500 hover:bg-gray-50"
                          title="Set as cover"
                        >
                          {item.generations.title || item.generations.prompt.slice(0, 40)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Library view — import the creator's clipart */}
            {view === "library" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Import From Your Library
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      Pull prior clipart generations into this pack. V1 is locked to clipart.
                    </p>
                  </div>
                  <button
                    onClick={addSelectedLibraryItems}
                    disabled={selectedLibraryIds.size === 0}
                    className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    Add Selected ({selectedLibraryIds.size})
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={libraryQuery}
                    onChange={(e) => setLibraryQuery(e.target.value)}
                    placeholder="Search your clipart library..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadLibrary();
                    }}
                  />
                  <button
                    onClick={loadLibrary}
                    disabled={libraryLoading}
                    className="shrink-0 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {libraryLoading ? "Loading..." : "Search"}
                  </button>
                </div>

                {libraryResults.length === 0 && !libraryLoading && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-400">
                      Your clipart library will appear here after you generate images.
                    </p>
                  </div>
                )}

                {libraryResults.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {libraryResults.map((gen) => {
                      const isAdded = itemGenerationIds.has(gen.id);
                      const isSelected = selectedLibraryIds.has(gen.id);
                      return (
                        <button
                          key={gen.id}
                          onClick={() => {
                            if (!isAdded) toggleSelectedLibrary(gen.id);
                          }}
                          disabled={isAdded}
                          className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                            isAdded
                              ? "border-green-200 bg-green-50 opacity-60"
                              : isSelected
                                ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100"
                                : "border-gray-100 bg-white hover:border-pink-200 hover:shadow-md"
                          }`}
                        >
                          <div className="relative aspect-square bg-gray-50">
                            <Image
                              src={gen.transparent_image_url || gen.image_url}
                              alt={gen.title || gen.prompt}
                              fill
                              className="object-contain p-2"
                              sizes="(max-width: 640px) 50vw, 20vw"
                            />
                            <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-gray-700 shadow-sm">
                              {isAdded ? "Added" : isSelected ? "Selected" : "Pick"}
                            </div>
                          </div>
                          <p className="truncate px-2 py-1.5 text-[11px] text-gray-500">
                            {gen.title || gen.prompt.slice(0, 40)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Browse view — search and add assets */}
            {view === "browse" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Search Public Catalog</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      Add approved public clipart to this pack when it fits the theme.
                    </p>
                  </div>
                  <button
                    onClick={addSelectedCatalogItems}
                    disabled={selectedCatalogIds.size === 0}
                    className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    Add Selected ({selectedCatalogIds.size})
                  </button>
                </div>
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search public clipart catalog..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchAssets();
                    }}
                  />
                  <button
                    onClick={searchAssets}
                    disabled={!searchQuery.trim() || searching}
                    className="shrink-0 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>

                {searchResults.length === 0 && !searching && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-400">
                      Search for clipart to add to your pack
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {searchResults.map((gen) => {
                      const isAdded = itemGenerationIds.has(gen.id);
                      const isSelected = selectedCatalogIds.has(gen.id);
                      return (
                        <button
                          key={gen.id}
                          onClick={() => {
                            if (!isAdded) toggleSelectedCatalog(gen.id);
                          }}
                          disabled={isAdded}
                          className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                            isAdded
                              ? "border-green-200 bg-green-50 opacity-60"
                              : isSelected
                                ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100"
                                : "border-gray-100 bg-white hover:border-pink-200 hover:shadow-md"
                          }`}
                        >
                          <div className="relative aspect-square bg-gray-50">
                            <Image
                              src={gen.transparent_image_url || gen.image_url}
                              alt={gen.title || gen.prompt}
                              fill
                              className="object-contain p-2"
                              sizes="(max-width: 640px) 50vw, 20vw"
                            />
                            {isAdded && (
                              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {!isAdded && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                  {isSelected ? "Selected" : "Select"}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="truncate px-2 py-1.5 text-[11px] text-gray-500">
                            {gen.title || gen.prompt.slice(0, 40)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Generate view — batch generate new assets */}
            {view === "generate" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700">
                  Generate Into This Pack
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Add one asset idea per line. We wrap each request with the pack brief,
                  audience, use case, and transparent clipart requirements.
                </p>

                <div className="mt-4 space-y-3">
                  <textarea
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    rows={5}
                    placeholder={"pink rose bouquet\nfloral corner border\nsunflower sticker\nwatering can with flowers"}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                  />

                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Count
                      </label>
                      <select
                        value={genCount}
                        onChange={(e) => setGenCount(Number(e.target.value))}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >
                        {[3, 5, 10, 15, 20].map((n) => (
                          <option key={n} value={n}>
                            {n} items ({n} credits)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Style
                      </label>
                      <select
                        value={genStyle}
                        onChange={(e) => setGenStyle(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >
                        <option value="flat">Flat</option>
                        <option value="cartoon">Cartoon</option>
                        <option value="sticker">Sticker</option>
                        <option value="vintage">Vintage</option>
                        <option value="watercolor">Watercolor</option>
                      </select>
                    </div>

                    <button
                      onClick={batchGenerate}
                      disabled={!genPrompt.trim() || generating}
                      className="rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                    >
                      {generating ? genProgress || "Generating..." : `Generate ${genCount} Items`}
                    </button>
                  </div>
                </div>
              </div>
            )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom publish bar */}
      {pack && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3 text-sm text-gray-500">
              <span>{items.length} items</span>
              <span className="hidden sm:inline">
                {completeChecklistCount}/{checklist.length} checklist
              </span>
              {pack.zip_status === "ready" && (
                <span className="text-green-600">ZIP ready</span>
              )}
              {pack.zip_status === "building" && (
                <span className="text-amber-600">Building ZIP...</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pack.is_published && pack.zip_status === "ready" && pack.categories?.slug && (
                <button
                  onClick={() =>
                    router.push(`/design-bundles/${pack.categories!.slug}/${pack.slug}`)
                  }
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Pack
                </button>
              )}
              <button
                onClick={publishPack}
                disabled={publishing || !canPublish}
                className="rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {publishing
                  ? "Publishing..."
                  : pack.is_published
                    ? "Republish"
                    : visibility === "public"
                      ? "Publish Pack"
                      : "Save Private"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
