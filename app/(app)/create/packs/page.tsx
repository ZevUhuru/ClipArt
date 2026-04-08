"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CreateModeToggle } from "@/components/CreateModeToggle";
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
  is_published: boolean;
  zip_status: string;
  item_count: number;
  pack_items: PackItem[];
  categories?: { slug: string; name: string } | null;
}

type EditorView = "editor" | "browse" | "generate";

export default function CreatePacksPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto max-w-5xl px-4 py-4">
              <CreateModeToggle />
            </div>
          </div>
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PackItem[]>([]);
  const [coverItemId, setCoverItemId] = useState<string | null>(null);

  const [view, setView] = useState<EditorView>("editor");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Generation[]>([]);
  const [searching, setSearching] = useState(false);

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
        if (loaded.pack_items?.length) {
          const sorted = [...loaded.pack_items].sort(
            (a, b) => a.sort_order - b.sort_order,
          );
          setItems(sorted);
        }
      })
      .catch(() => {
        setError("Could not load that bundle. It may not exist or you don\u2019t have access.");
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
      setSuccessMsg("Bundle created!");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bundle");
    } finally {
      setSaving(false);
    }
  }, [title, description, categoryId, tags, visibility]);

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

  const searchAssets = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=40`,
      );
      const data = await res.json();
      setSearchResults(data.results || data.images || []);
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
      const res = await fetch("/api/generate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: genPrompt.trim(),
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
  }, [pack, genPrompt, genStyle, genCount]);

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
      setSuccessMsg("Bundle published! ZIP is ready.");
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
      <div className="min-h-screen">
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <CreateModeToggle />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Create a Bundle</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign up to create themed bundles of clip art, coloring pages, and illustrations
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

  const itemGenerationIds = new Set(items.map((i) => i.generation_id));

  if (loadingExisting) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <CreateModeToggle />
          </div>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
          <span className="ml-3 text-sm text-gray-500">Loading bundle...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <CreateModeToggle />
          {!pack && (
            <div className="mt-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your bundle... (e.g. Spring Garden Clip Art Bundle)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && title.trim()) createPack();
                }}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={createPack}
                  disabled={!title.trim() || saving}
                  className="rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Bundle"}
                </button>
              </div>
            </div>
          )}
          {pack && (
            <div className="mt-2 flex items-center gap-3">
              <h2 className="flex-1 truncate text-lg font-bold text-gray-900">{pack.title}</h2>
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                {items.length} items
              </span>
              {pack.is_published && pack.zip_status === "ready" && (
                <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Published
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
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
            {/* Metadata section */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white">
              <button
                onClick={() => setShowMetadata((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-gray-700">Bundle Details</span>
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-100"
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
                      placeholder="Describe what's in this bundle..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-100"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-100"
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
                  </div>
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => setView("editor")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "editor"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Bundle Items ({items.length})
              </button>
              <button
                onClick={() => setView("browse")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "browse"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                + Browse
              </button>
              <button
                onClick={() => setView("generate")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "generate"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                + Generate
              </button>
            </div>

            {/* Editor view — items grid */}
            {view === "editor" && (
              <>
                {items.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Add assets to your bundle</h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
                      Search and add existing clip art, coloring pages, or illustrations.
                    </p>
                    <button
                      onClick={() => setView("browse")}
                      className="mt-4 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-sm hover:shadow-md"
                    >
                      Browse Assets
                    </button>
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
                            src={item.generations.image_url}
                            alt={item.generations.title || item.generations.prompt}
                            fill
                            className="object-cover"
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
                        </div>

                        <button
                          onClick={() => setCoverItemId(item.generation_id)}
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

            {/* Browse view — search and add assets */}
            {view === "browse" && (
              <div>
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clip art, coloring pages, illustrations..."
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
                      Search for assets to add to your bundle
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {searchResults.map((gen) => {
                      const isAdded = itemGenerationIds.has(gen.id);
                      return (
                        <button
                          key={gen.id}
                          onClick={() => {
                            if (!isAdded) addItems([gen.id]);
                          }}
                          disabled={isAdded}
                          className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                            isAdded
                              ? "border-green-200 bg-green-50 opacity-60"
                              : "border-gray-100 bg-white hover:border-pink-200 hover:shadow-md"
                          }`}
                        >
                          <div className="relative aspect-square">
                            <Image
                              src={gen.image_url}
                              alt={gen.title || gen.prompt}
                              fill
                              className="object-cover"
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
                                  + Add
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
                  Generate Themed Assets
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Describe a theme and we&apos;ll generate multiple variations. Each generation uses 1 credit.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="Describe your theme... (e.g. spring garden flowers)"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && genPrompt.trim() && !generating) batchGenerate();
                    }}
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
          </>
        )}
      </div>

      {/* Sticky bottom publish bar */}
      {pack && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{items.length} items</span>
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
                    router.push(`/packs/${pack.categories!.slug}/${pack.slug}`)
                  }
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Bundle
                </button>
              )}
              <button
                onClick={publishPack}
                disabled={publishing || items.length === 0}
                className="rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {publishing
                  ? "Publishing..."
                  : pack.is_published
                    ? "Republish"
                    : visibility === "public"
                      ? "Publish Bundle"
                      : "Save Private"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
