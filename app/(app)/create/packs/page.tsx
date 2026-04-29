"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAppStore } from "@/stores/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  type ModelKey,
  type StyleKey,
  STYLE_LABELS,
  VALID_STYLES,
} from "@/lib/styles";

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
  audience?: string | null;
  pack_goal?: string | null;
  long_description?: string | null;
  whats_included?: string | null;
  use_cases?: string | null;
  license_summary?: string | null;
  category_id: string | null;
  tags: string[];
  visibility: string;
  is_free?: boolean;
  price_cents?: number | null;
  compare_at_price_cents?: number | null;
  launch_price_cents?: number | null;
  launch_ends_at?: string | null;
  cover_image_url: string | null;
  cover_generation_id?: string | null;
  is_published: boolean;
  zip_status: string;
  item_count: number;
  pack_items?: PackItem[];
  categories?: { slug: string; name: string } | null;
}

type EditorView = "editor" | "library" | "browse" | "generate";

interface PromptRow {
  id: string;
  title: string;
  prompt: string;
}

const PACK_AUDIENCES = [
  "Teachers and classrooms",
  "Homeschool families",
  "Parents and kids",
  "Etsy and craft shops",
  "Printable creators",
  "Party planners",
  "Event hosts",
  "Small business marketing",
  "Casual creators",
  "AI video creators",
  "Sticker makers",
  "Church and community groups",
];

const PACK_GOALS = [
  "Classroom decor",
  "Worksheet graphics",
  "Flashcards",
  "Coloring page pack",
  "Sticker sheet",
  "Invitation set",
  "Party printable set",
  "Event signage",
  "Seasonal bundle",
  "Seasonal campaign",
  "Etsy listing bundle",
  "Social media graphics",
  "Product mockup",
  "Character sheet",
  "Kids activity pack",
];

const MODEL_OPTIONS: { value: "recommended" | ModelKey; label: string; description: string }[] = [
  { value: "recommended", label: "Recommended", description: "Use the current best model for this style" },
  { value: "gemini", label: "Gemini Flash Image", description: "Fast general clip art generation" },
  { value: "gemini-pro", label: "Gemini Pro Image", description: "Premium detail for hero assets" },
  { value: "gpt-image-1.5", label: "GPT Image 1.5", description: "OpenAI image model with transparent background support" },
  { value: "gpt-image-2", label: "GPT Image 2", description: "High quality, may need background removal" },
  { value: "gpt-image-1", label: "GPT Image 1", description: "Legacy OpenAI image model" },
];

const DEFAULT_LICENSE_SUMMARY =
  "Commercial use is included. Buyers may use the finished designs in personal projects, classroom materials, printables, physical products, and small business designs. They may not resell or redistribute the original image files as standalone clip art.";

function createPromptRow(prompt = "", title = ""): PromptRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    prompt,
  };
}

function dollarsToCents(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

function centsToDollars(value?: number | null): string {
  if (!value || value <= 0) return "";
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2);
}

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
  {
    title: "Birthday Party Printable Pack",
    description:
      "A cheerful party-ready bundle with matching invitations, cupcake toppers, favor tags, signs, and cute decorative clip art for a themed kids birthday event.",
    tags: "birthday, party, invitation, printable, kids",
    audience: "Party planners",
    goal: "Party printable set",
  },
  {
    title: "Homeschool Animal Flashcards Pack",
    description:
      "A kid-friendly animal learning bundle with matching flashcard illustrations, worksheet accents, labels, and simple activity graphics for homeschool lessons.",
    tags: "homeschool, animals, flashcards, worksheet, kids",
    audience: "Homeschool families",
    goal: "Flashcards",
  },
];

const STUDIO_PROMISES = [
  "Set the pack brief.",
  "Add generated or existing clipart.",
  "Choose a cover image.",
  "Publish when the pack is ready.",
];

const STUDIO_WORKFLOW = [
  { label: "Brief", detail: "Title, audience, goal." },
  { label: "Assets", detail: "Generate or import." },
  { label: "Cover", detail: "Select a preview." },
  { label: "Publish", detail: "Build the ZIP." },
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
  const [longDescription, setLongDescription] = useState("");
  const [whatsIncluded, setWhatsIncluded] = useState("");
  const [useCases, setUseCases] = useState("");
  const [licenseSummary, setLicenseSummary] = useState(DEFAULT_LICENSE_SUMMARY);
  const [isFree, setIsFree] = useState(true);
  const [priceDollars, setPriceDollars] = useState("");
  const [compareAtDollars, setCompareAtDollars] = useState("");
  const [launchPriceDollars, setLaunchPriceDollars] = useState("");
  const [launchEndsAt, setLaunchEndsAt] = useState("");
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

  const [promptRows, setPromptRows] = useState<PromptRow[]>([
    createPromptRow("pink rose bouquet"),
    createPromptRow("floral corner border"),
    createPromptRow("sunflower sticker"),
    createPromptRow("watering can with flowers"),
    createPromptRow("garden seed packet"),
  ]);
  const [genStyle, setGenStyle] = useState<StyleKey>("flat");
  const [genModel, setGenModel] = useState<"recommended" | ModelKey>("recommended");
  const [variationsPerIdea, setVariationsPerIdea] = useState(1);
  const [assetAvailability, setAssetAvailability] = useState<"exclusive" | "reusable">("exclusive");
  const [sharedStyleNotes, setSharedStyleNotes] = useState("");
  const [avoidList, setAvoidList] = useState("");
  const [keepCohesive, setKeepCohesive] = useState(true);
  const [showAdvancedGeneration, setShowAdvancedGeneration] = useState(false);
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
        setAudience(loaded.audience || PACK_AUDIENCES[0]);
        setPackGoal(loaded.pack_goal || PACK_GOALS[0]);
        setLongDescription(loaded.long_description || "");
        setWhatsIncluded(loaded.whats_included || "");
        setUseCases(loaded.use_cases || "");
        setLicenseSummary(loaded.license_summary || DEFAULT_LICENSE_SUMMARY);
        setIsFree(loaded.is_free !== false);
        setPriceDollars(centsToDollars(loaded.price_cents));
        setCompareAtDollars(centsToDollars(loaded.compare_at_price_cents));
        setLaunchPriceDollars(centsToDollars(loaded.launch_price_cents));
        setLaunchEndsAt(loaded.launch_ends_at ? loaded.launch_ends_at.slice(0, 10) : "");
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
          audience,
          pack_goal: packGoal,
          long_description: longDescription.trim() || null,
          whats_included: whatsIncluded.trim() || null,
          use_cases: useCases.trim() || null,
          license_summary: licenseSummary.trim() || null,
          is_free: isFree,
          price_cents: isFree ? null : dollarsToCents(priceDollars),
          compare_at_price_cents: dollarsToCents(compareAtDollars),
          launch_price_cents: dollarsToCents(launchPriceDollars),
          launch_ends_at: launchEndsAt || null,
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
  }, [
    title,
    description,
    categoryId,
    tags,
    visibility,
    audience,
    packGoal,
    longDescription,
    whatsIncluded,
    useCases,
    licenseSummary,
    isFree,
    priceDollars,
    compareAtDollars,
    launchPriceDollars,
    launchEndsAt,
    router,
  ]);

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
          audience,
          pack_goal: packGoal,
          long_description: longDescription.trim() || null,
          whats_included: whatsIncluded.trim() || null,
          use_cases: useCases.trim() || null,
          license_summary: licenseSummary.trim() || null,
          is_free: isFree,
          price_cents: isFree ? null : dollarsToCents(priceDollars),
          compare_at_price_cents: dollarsToCents(compareAtDollars),
          launch_price_cents: dollarsToCents(launchPriceDollars),
          launch_ends_at: launchEndsAt || null,
        }),
      });
    } catch {
      // silent auto-save failure
    }
  }, [
    pack,
    title,
    description,
    categoryId,
    tags,
    visibility,
    audience,
    packGoal,
    longDescription,
    whatsIncluded,
    useCases,
    licenseSummary,
    isFree,
    priceDollars,
    compareAtDollars,
    launchPriceDollars,
    launchEndsAt,
  ]);

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
  }, [
    title,
    description,
    categoryId,
    tags,
    visibility,
    audience,
    packGoal,
    longDescription,
    whatsIncluded,
    useCases,
    licenseSummary,
    isFree,
    priceDollars,
    compareAtDollars,
    launchPriceDollars,
    launchEndsAt,
    autoSave,
  ]);

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

  const addPromptRow = useCallback(() => {
    setPromptRows((prev) => [...prev, createPromptRow()]);
  }, []);

  const updatePromptRow = useCallback((id: string, field: "title" | "prompt", value: string) => {
    setPromptRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }, []);

  const removePromptRow = useCallback((id: string) => {
    setPromptRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  }, []);

  const pastePromptList = useCallback(async () => {
    const pasted = window.prompt("Paste one asset idea per line:");
    if (!pasted) return;
    const rows = pasted
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => createPromptRow(line));
    if (rows.length > 0) setPromptRows(rows);
  }, []);

  const batchGenerate = useCallback(async () => {
    const activeRows = promptRows
      .map((row) => ({ ...row, prompt: row.prompt.trim(), title: row.title.trim() }))
      .filter((row) => row.prompt);
    if (!pack || activeRows.length === 0) return;
    setGenerating(true);
    const totalCount = Math.min(activeRows.length * variationsPerIdea, 20);
    setGenProgress(`Generating ${totalCount} item${totalCount !== 1 ? "s" : ""}...`);
    setError(null);
    try {
      const prompts = activeRows.map((row) => {
        const promptParts = [
          `Create one transparent PNG clip art asset for a cohesive pack titled "${title.trim() || pack.title}"`,
          row.title ? `Asset title: ${row.title}` : null,
          `Asset idea: ${row.prompt}`,
          description.trim() ? `Short pack summary: ${description.trim()}` : null,
          longDescription.trim() ? `Detailed pack direction: ${longDescription.trim()}` : null,
          `Audience: ${audience}`,
          `Use case: ${packGoal}`,
          tags.trim() ? `Theme tags: ${tags.trim()}` : null,
          sharedStyleNotes.trim() ? `Shared style notes: ${sharedStyleNotes.trim()}` : null,
          avoidList.trim() ? `Avoid: ${avoidList.trim()}` : null,
          keepCohesive
            ? "Keep this visually cohesive with the rest of the bundle."
            : null,
          "Isolated on a transparent or white-safe background, suitable for a commercial clip art bundle.",
        ];
        return {
          title: row.title || undefined,
          prompt: promptParts.filter(Boolean).join(". "),
        };
      });

      const res = await fetch("/api/generate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompts,
          style: genStyle,
          variationsPerIdea,
          model: genModel === "recommended" ? undefined : genModel,
          assetAvailability,
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
      setPromptRows([createPromptRow()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch generation failed");
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  }, [
    pack,
    promptRows,
    variationsPerIdea,
    title,
    description,
    longDescription,
    audience,
    packGoal,
    tags,
    sharedStyleNotes,
    avoidList,
    keepCohesive,
    genStyle,
    genModel,
    assetAvailability,
  ]);

  const itemGenerationIds = new Set(items.map((i) => i.generation_id));

  const addItems = useCallback(
    async (generationIds: string[], isExclusive = false) => {
      if (!pack) return;
      try {
        const res = await fetch(`/api/packs/${pack.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generation_ids: generationIds, is_exclusive: isExclusive }),
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
    await addItems(ids, false);
    setSelectedLibraryIds(new Set());
  }, [addItems, selectedLibraryIds, itemGenerationIds]);

  const addSelectedCatalogItems = useCallback(async () => {
    const ids = Array.from(selectedCatalogIds).filter((id) => !itemGenerationIds.has(id));
    if (ids.length === 0) return;
    await addItems(ids, false);
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

  const toggleItemExclusive = useCallback(
    async (item: PackItem) => {
      if (!pack) return;
      const nextValue = !item.is_exclusive;
      setItems((prev) =>
        prev.map((candidate) =>
          candidate.id === item.id ? { ...candidate, is_exclusive: nextValue } : candidate,
        ),
      );
      try {
        const res = await fetch(`/api/packs/${pack.id}/items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_ids: [item.id], is_exclusive: nextValue }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } catch (err) {
        setItems((prev) =>
          prev.map((candidate) =>
            candidate.id === item.id ? { ...candidate, is_exclusive: item.is_exclusive } : candidate,
          ),
        );
        setError(err instanceof Error ? err.message : "Failed to update item availability");
      }
    },
    [pack],
  );

  const clearPackCover = useCallback(async () => {
    if (!pack) return;
    setCoverItemId(null);
    try {
      const res = await fetch(`/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cover_generation_id: null,
          cover_image_url: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPack((prev) =>
        prev
          ? {
              ...prev,
              cover_generation_id: null,
              cover_image_url: null,
            }
          : null,
      );
      setSuccessMsg("Cover reset to automatic");
      setTimeout(() => setSuccessMsg(null), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cover");
    }
  }, [pack]);

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
      <div className="min-h-screen bg-[#fbfaf9] pb-16">
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
          </AnimatePresence>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-500">
                Packs
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-gray-800 sm:text-4xl">
                Create or continue a clipart pack.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
                Set up the basic brief first. After that, you can generate pack-specific assets,
                import from your library, pick a cover, and publish.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {STUDIO_PROMISES.map((promise) => (
                  <div
                    key={promise}
                    className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 text-sm font-medium text-gray-600"
                  >
                    {promise}
                  </div>
                ))}
              </div>

              {recentPacks.length > 0 && (
                <div className="mt-6 rounded-[1.5rem] border border-gray-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-gray-800">Continue a pack</h2>
                    <span className="text-xs font-semibold text-gray-400">
                      {recentPacks.length} drafts
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {recentPacks.slice(0, 3).map((recentPack) => (
                      <button
                        key={recentPack.id}
                        onClick={() => router.push(`/create/packs?id=${recentPack.id}`)}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-pink-200 hover:bg-pink-50/30"
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
                          <p className="truncate text-sm font-semibold text-gray-700">
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

            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="rounded-[1.25rem] border border-pink-100 bg-pink-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-500">
                  New Pack
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-800">
                  Pack setup
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  These fields guide generation and make the pack easier to organize later.
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
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-pink-100 transition hover:bg-pink-100 hover:text-pink-700"
                      >
                        {starter.title.replace(" Clip Art Pack", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={createPack}
                  disabled={!title.trim() || saving}
                  className="w-full rounded-2xl bg-brand-gradient px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-100 transition-all hover:brightness-105 disabled:opacity-50"
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
  const activePromptCount = promptRows.filter((row) => row.prompt.trim()).length;
  const generationCount = Math.min(activePromptCount * variationsPerIdea, 20);
  const exclusiveCount = items.filter((item) => item.is_exclusive).length;
  const checklist = [
    { label: "Title", complete: Boolean(title.trim()) },
    { label: "Short description", complete: description.trim().length >= 40 },
    { label: "Long description", complete: visibility === "private" || longDescription.trim().length >= 140 },
    { label: "Category", complete: Boolean(categoryId) },
    { label: "Tags", complete: tags.split(",").map((t) => t.trim()).filter(Boolean).length >= 3 },
    { label: "Cover", complete: Boolean(coverItemId || pack?.cover_generation_id || items.length > 0) },
    { label: "Price ready", complete: isFree || Boolean(dollarsToCents(priceDollars)) },
    { label: "At least 12 assets", complete: items.length >= 12 },
    { label: "20 assets recommended", complete: items.length >= 20 },
    { label: "Clipart only", complete: items.every((item) => item.generations.content_type === "clipart") },
    {
      label: "Transparent-ready assets",
      complete: items.length > 0 && transparentCount >= Math.ceil(items.length * 0.8),
    },
  ];
  const completeChecklistCount = checklist.filter((item) => item.complete).length;
  const canPublish = Boolean(pack && items.length > 0 && title.trim());

  return (
    <div className="min-h-screen bg-[#fbfaf9] pb-24">
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
            <section className="mb-6 rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-500">
                    Pack Workspace
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-800 sm:text-3xl">
                      {title || pack.title}
                    </h1>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                      {items.length} assets
                    </span>
                    <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
                      {completeChecklistCount}/{checklist.length} ready
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
                    Daily workspace for the pack brief, assets, cover, and publish readiness.
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-4">
                    {STUDIO_WORKFLOW.map((step, index) => (
                      <div
                        key={step.label}
                        className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-pink-600 ring-1 ring-pink-100">
                            {index + 1}
                          </span>
                          <p className="text-sm font-semibold text-gray-700">{step.label}</p>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-gray-400">{step.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-pink-100 bg-pink-50/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">
                    Next Step
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-800">
                    {items.length === 0 ? "Add assets" : "Review cover and publish status"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {items.length === 0
                      ? "Generate a starter set or import matching clipart from your library."
                      : "Set the cover, fill any missing brief fields, then publish when ready."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setView("generate")}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-600 shadow-sm ring-1 ring-pink-100 transition hover:bg-pink-100"
                    >
                      Generate Assets
                    </button>
                    <button
                      onClick={() => setView("library")}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
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
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-700 shadow-sm">
                        Cover
                      </span>
                      {(coverItemId || pack.cover_generation_id) && (
                        <button
                          onClick={clearPackCover}
                          className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-gray-500 shadow-sm transition hover:text-pink-600"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">
                      Pack Summary
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-800">
                      {title || "Untitled Clipart Pack"}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {description ||
                        "Add a short description so the pack stays easy to organize."}
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
                        <p className="font-semibold text-gray-700">{items.length}</p>
                        <p className="mt-0.5 text-gray-500">Assets</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="font-semibold text-gray-700">{transparentCount}</p>
                        <p className="mt-0.5 text-gray-500">Transparent</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="font-semibold text-gray-700">{exclusiveCount}</p>
                        <p className="mt-0.5 text-gray-500">Exclusive</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="font-semibold text-gray-700">
                          {isFree ? "Free" : `$${priceDollars || "0"}`}
                        </p>
                        <p className="mt-0.5 text-gray-500">Price</p>
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
                      <h3 className="mt-1 text-lg font-semibold text-gray-800">
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
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
                    You can publish early, but this checklist helps keep packs organized before
                    they are shared or downloaded.
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
                  <span className="block text-sm font-semibold text-gray-800">Pack Brief</span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    Basic context used for generation, organization, and publishing.
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
                    <label className="mb-1 block text-xs font-medium text-gray-500">Short description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe what's in this pack and what customers can make with it..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Long SEO description</label>
                      <textarea
                        value={longDescription}
                        onChange={(e) => setLongDescription(e.target.value)}
                        rows={5}
                        placeholder="Go deeper on the theme, style, buyer use cases, and why this bundle is useful..."
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">What&apos;s included</label>
                        <textarea
                          value={whatsIncluded}
                          onChange={(e) => setWhatsIncluded(e.target.value)}
                          rows={2}
                          placeholder="50 transparent PNGs, 300 DPI, matching chibi ramen characters..."
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Use cases</label>
                        <textarea
                          value={useCases}
                          onChange={(e) => setUseCases(e.target.value)}
                          rows={2}
                          placeholder="Sticker sheets, menu tags, food truck graphics, Etsy listings, classroom rewards..."
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Pricing</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Start with a $9 launch / $12 regular test for polished 50-item packs.
                        </p>
                      </div>
                      <div className="flex rounded-xl bg-white p-1 ring-1 ring-gray-200">
                        <button
                          type="button"
                          onClick={() => setIsFree(true)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            isFree ? "bg-green-50 text-green-700" : "text-gray-400"
                          }`}
                        >
                          Free
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFree(false)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            !isFree ? "bg-pink-50 text-pink-700" : "text-gray-400"
                          }`}
                        >
                          Paid
                        </button>
                      </div>
                    </div>
                    {!isFree && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={priceDollars}
                          onChange={(e) => setPriceDollars(e.target.value)}
                          placeholder="Regular $"
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={launchPriceDollars}
                          onChange={(e) => setLaunchPriceDollars(e.target.value)}
                          placeholder="Launch $"
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={compareAtDollars}
                          onChange={(e) => setCompareAtDollars(e.target.value)}
                          placeholder="Compare at $"
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                        <input
                          type="date"
                          value={launchEndsAt}
                          onChange={(e) => setLaunchEndsAt(e.target.value)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500">License summary</label>
                    <textarea
                      value={licenseSummary}
                      onChange={(e) => setLicenseSummary(e.target.value)}
                      rows={3}
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
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  view === "editor"
                    ? "bg-pink-50 text-pink-700 ring-1 ring-pink-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Canvas
                <span className="mt-0.5 block text-xs font-medium opacity-60">{items.length} assets</span>
              </button>
              <button
                onClick={() => setView("library")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  view === "library"
                    ? "bg-pink-50 text-pink-700 ring-1 ring-pink-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Library
                <span className="mt-0.5 block text-xs font-medium opacity-60">Your clipart</span>
              </button>
              <button
                onClick={() => setView("browse")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  view === "browse"
                    ? "bg-pink-50 text-pink-700 ring-1 ring-pink-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Catalog
                <span className="mt-0.5 block text-xs font-medium opacity-60">Public assets</span>
              </button>
              <button
                onClick={() => setView("generate")}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  view === "generate"
                    ? "bg-pink-50 text-pink-700 ring-1 ring-pink-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Generate
                <span className="mt-0.5 block text-xs font-medium opacity-60">New assets</span>
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
                        <div className="inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-500">
                          Empty Canvas
                        </div>
                        <h3 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-gray-800">
                          Add assets to this pack.
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
                          Generate a starter batch from the brief, or import existing clipart
                          that matches the pack.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            onClick={() => setView("generate")}
                            className="rounded-full bg-brand-gradient px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-100 hover:brightness-105"
                          >
                            Generate Starter Set
                          </button>
                          <button
                            onClick={() => setView("library")}
                            className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
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
                          {item.is_exclusive && (
                            <div className="absolute left-1 top-6 rounded-md bg-gray-950/85 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white shadow-sm">
                              Exclusive
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-50 p-2">
                          <p className="truncate text-[11px] text-gray-500">
                            {item.generations.title || item.generations.prompt.slice(0, 40)}
                          </p>
                          <div className="mt-2 flex gap-1">
                            <button
                              onClick={() => setPackCover(item)}
                              className="flex-1 rounded-lg bg-pink-50 px-2 py-1 text-[10px] font-bold text-pink-600 hover:bg-pink-100"
                            >
                              Set cover
                            </button>
                            <button
                              onClick={() => toggleItemExclusive(item)}
                              className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                                item.is_exclusive
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              {item.is_exclusive ? "Exclusive" : "Reusable"}
                            </button>
                          </div>
                        </div>
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
                    className="shrink-0 rounded-xl bg-pink-50 px-5 py-2.5 text-sm font-semibold text-pink-700 ring-1 ring-pink-100 hover:bg-pink-100 disabled:opacity-50"
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
                    className="shrink-0 rounded-xl bg-pink-50 px-5 py-2.5 text-sm font-semibold text-pink-700 ring-1 ring-pink-100 hover:bg-pink-100 disabled:opacity-50"
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Generate assets for this pack
                    </h3>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-400">
                      Add one idea per row. We use the pack brief, audience, goal, style,
                      and settings to keep the generated assets cohesive.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700">
                    {generationCount} credit{generationCount !== 1 ? "s" : ""} planned
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-800">
                  <span className="font-bold">How context works:</span> each row is one asset idea.
                  Pack Studio adds your pack title, short description, long direction, audience,
                  goal, tags, and selected style so the outputs belong together.
                </div>

                <div className="mt-5 space-y-3">
                  {promptRows.map((row, index) => (
                    <div key={row.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          Idea {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePromptRow(row.id)}
                          disabled={promptRows.length === 1}
                          className="text-xs font-bold text-gray-400 transition hover:text-red-500 disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-[0.75fr_1.5fr]">
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) => updatePromptRow(row.id, "title", e.target.value)}
                          placeholder="Optional title"
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                        <input
                          type="text"
                          value={row.prompt}
                          onChange={(e) => updatePromptRow(row.id, "prompt", e.target.value)}
                          placeholder="e.g. chibi panda eating ramen"
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addPromptRow}
                    className="rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-700 transition hover:bg-pink-100"
                  >
                    + Add idea
                  </button>
                  <button
                    type="button"
                    onClick={pastePromptList}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                  >
                    Paste list
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Style</label>
                    <select
                      value={genStyle}
                      onChange={(e) => setGenStyle(e.target.value as StyleKey)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    >
                      {VALID_STYLES.clipart.map((style) => (
                        <option key={style} value={style}>
                          {STYLE_LABELS[style] || style}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Asset availability</label>
                    <select
                      value={assetAvailability}
                      onChange={(e) => setAssetAvailability(e.target.value as "exclusive" | "reusable")}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="exclusive">Pack-exclusive by default</option>
                      <option value="reusable">Reusable in my library</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedGeneration((value) => !value)}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-bold text-gray-700"
                >
                  Advanced generation settings
                  <span className="text-xs text-gray-400">{showAdvancedGeneration ? "Hide" : "Show"}</span>
                </button>

                {showAdvancedGeneration && (
                  <div className="mt-3 grid gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Model</label>
                      <select
                        value={genModel}
                        onChange={(e) => setGenModel(e.target.value as "recommended" | ModelKey)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        {MODEL_OPTIONS.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-400">
                        {MODEL_OPTIONS.find((model) => model.value === genModel)?.description}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Variations per idea</label>
                      <select
                        value={variationsPerIdea}
                        onChange={(e) => setVariationsPerIdea(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        {[1, 2, 3].map((value) => (
                          <option key={value} value={value}>
                            {value} variation{value !== 1 ? "s" : ""} per idea
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Shared style notes</label>
                      <textarea
                        value={sharedStyleNotes}
                        onChange={(e) => setSharedStyleNotes(e.target.value)}
                        rows={3}
                        placeholder="Same line weight, cute rounded bodies, warm ramen-shop palette..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Avoid</label>
                      <textarea
                        value={avoidList}
                        onChange={(e) => setAvoidList(e.target.value)}
                        rows={3}
                        placeholder="No text, no watermarks, no busy backgrounds, no duplicate poses..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                    <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200">
                      <input
                        type="checkbox"
                        checked={keepCohesive}
                        onChange={(e) => setKeepCohesive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      Keep all generated images visually cohesive
                    </label>
                  </div>
                )}

                <button
                  onClick={batchGenerate}
                  disabled={generationCount === 0 || generating}
                  className="mt-5 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                >
                  {generating
                    ? genProgress || "Generating..."
                    : `Generate ${generationCount} item${generationCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* Compact publish actions */}
      {pack && (
        <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="mx-auto flex max-w-7xl justify-end">
            <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl border border-gray-100 bg-white/92 p-2 shadow-xl shadow-gray-200/70 backdrop-blur-xl">
              <div className="hidden min-w-0 px-2 text-xs text-gray-500 sm:block">
                <span className="font-semibold text-gray-700">{items.length}</span> assets
                <span className="mx-2 text-gray-300">/</span>
                <span className="font-semibold text-gray-700">{completeChecklistCount}</span>
                <span>/{checklist.length} ready</span>
                {pack.zip_status === "ready" && (
                  <span className="ml-2 text-green-600">ZIP ready</span>
                )}
                {pack.zip_status === "building" && (
                  <span className="ml-2 text-amber-600">Building ZIP</span>
                )}
              </div>
              {pack.is_published && pack.zip_status === "ready" && pack.categories?.slug && (
                <button
                  onClick={() =>
                    router.push(`/design-bundles/${pack.categories!.slug}/${pack.slug}`)
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  View
                </button>
              )}
              <button
                onClick={publishPack}
                disabled={publishing || !canPublish}
                className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 disabled:opacity-50"
              >
                {publishing
                  ? "Publishing..."
                  : pack.is_published
                    ? "Republish"
                    : visibility === "public"
                      ? "Publish"
                      : "Save Private"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
