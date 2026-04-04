"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useGenerationQueue } from "@/stores/useGenerationQueue";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { CreateModeToggle } from "@/components/CreateModeToggle";
import { StylePicker } from "@/components/StylePicker";
import { GenerationQueue } from "@/components/GenerationQueue";
import { createBrowserClient } from "@/lib/supabase/client";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { ILLUSTRATION_ASPECT_OPTIONS, VALID_STYLES, type AspectRatio, type StyleKey } from "@/lib/styles";

const ILLUSTRATION_STYLES = VALID_STYLES.illustration;

const suggestedPrompts = [
  "cozy cottage in a snowy forest at dusk",
  "dragon flying over a medieval castle at sunset",
  "underwater coral reef with tropical fish",
  "bustling Japanese street market at night",
  "child reading a book under a giant tree",
  "robot tending a garden of glowing flowers",
];

function GenerationGrid({ items, loading }: { items: Generation[]; loading: boolean }) {
  const openDrawer = useImageDrawer((s) => s.open);

  if (loading) {
    return (
      <ImageGrid>
        {Array.from({ length: 8 }).map((_, i) => (
          <ImageCardSkeleton key={i} />
        ))}
      </ImageGrid>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">Nothing here yet.</p>
    );
  }

  const safeItems = items.filter((gen) => gen.id && gen.image_url);

  const drawerList = safeItems.map((gen) => ({
    id: gen.id,
    slug: gen.slug || gen.id,
    title: gen.prompt,
    url: gen.image_url,
    category: gen.category || "illustration-free",
    style: gen.style,
    aspect_ratio: gen.aspect_ratio,
  }));

  return (
    <ImageGrid>
      {safeItems.map((gen, idx) => (
        <ImageCard
          key={gen.id}
          image={drawerList[idx]}
          onClick={() => openDrawer(drawerList[idx], drawerList)}
        />
      ))}
    </ImageGrid>
  );
}

function RecentsGrid() {
  const { user, generations, generationsLoaded, setGenerations } = useAppStore();
  const illustrationGenerations = generations.filter(
    (g) => (g as Generation & { content_type?: string }).content_type === "illustration",
  );

  useEffect(() => {
    if (!user || generationsLoaded) return;

    async function fetchGenerations() {
      const supabase = createBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("generations")
        .select("id, image_url, prompt, style, content_type, category, slug, aspect_ratio, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setGenerations(data || []);
    }

    fetchGenerations();
  }, [user, generationsLoaded, setGenerations]);

  return (
    <GenerationGrid
      items={illustrationGenerations}
      loading={!generationsLoaded && !!user}
    />
  );
}

function CommunityGrid() {
  const [items, setItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const storeGenerations = useAppStore((s) => s.generations);

  useEffect(() => {
    async function fetchCommunity() {
      const supabase = createBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("generations")
        .select("id, image_url, prompt, style, content_type, category, slug, aspect_ratio, created_at")
        .eq("is_public", true)
        .eq("content_type", "illustration")
        .order("created_at", { ascending: false })
        .limit(50);

      setItems(data || []);
      setLoading(false);
    }

    fetchCommunity();
  }, []);

  const mergedItems = useMemo(() => {
    if (loading) return [];

    const communityIds = new Set(items.map((c) => c.id));
    const newFromStore = storeGenerations.filter(
      (g) =>
        g.id &&
        g.image_url &&
        !communityIds.has(g.id) &&
        (g as Generation & { content_type?: string }).content_type === "illustration",
    );

    return newFromStore.length > 0 ? [...newFromStore, ...items] : items;
  }, [storeGenerations, items, loading]);

  return <GenerationGrid items={mergedItems} loading={loading} />;
}

type Tab = "recents" | "community";

export default function IllustrationsCreatePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("storybook");
  const [isPublic, setIsPublic] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("recents");
  const resultRef = useRef<HTMLDivElement>(null);

  const { openAuthModal, user, generations, generationsLoaded } = useAppStore();
  const addJob = useGenerationQueue((s) => s.addJob);
  const queueJobs = useGenerationQueue((s) => s.jobs);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    addJob(prompt.trim(), style, isPublic, {
      contentType: "illustration",
      aspectRatio,
    });
    setPrompt("");
  }, [prompt, style, isPublic, aspectRatio, user, openAuthModal, addJob]);

  const illustrationGenerations = generations.filter(
    (g) => (g as Generation & { content_type?: string }).content_type === "illustration",
  );
  const hasRecents = generationsLoaded && illustrationGenerations.length > 0;
  const showEmptyState = !user || (generationsLoaded && illustrationGenerations.length === 0 && queueJobs.length === 0);

  return (
    <div className="min-h-screen">
      {/* Compact generator bar */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <CreateModeToggle />
          {/* Input row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your illustration... (e.g. cozy cottage in a snowy forest at dusk)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
                maxLength={1000}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="shrink-0 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create
            </button>
          </div>

          {/* Style picker + aspect ratio + share toggle */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StylePicker selected={style} onSelect={setStyle} styles={ILLUSTRATION_STYLES} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-0.5">
                {ILLUSTRATION_ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAspectRatio(opt.value)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      aspectRatio === opt.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title={opt.label}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {opt.icon === "portrait" && <rect x="4" y="2" width="8" height="12" rx="1" />}
                      {opt.icon === "landscape" && <rect x="2" y="4" width="12" height="8" rx="1" />}
                      {opt.icon === "square" && <rect x="3" y="3" width="10" height="10" rx="1" />}
                    </svg>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>
              <Link
                href="/illustrations"
                className="text-xs font-medium text-pink-500 hover:text-pink-700"
              >
                Browse Illustrations
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-gray-100"
              title={isPublic ? "Your creation will be shared with the community" : "Your creation will be private"}
            >
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublic ? "bg-green-400" : "bg-gray-200"}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${isPublic ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </span>
              <span className="text-gray-500">
                {isPublic ? "Public" : "Private"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Generation Queue */}
        {queueJobs.length > 0 && (
          <div className="mb-6">
            <GenerationQueue />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Empty state with prompt chips */}
        {showEmptyState && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Create your first illustration
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              Describe a scene and pick a style — we&apos;ll generate a full illustration with background and environment. Try one of these:
            </p>
            <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2">
              {suggestedPrompts.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabbed grids */}
        {!showEmptyState && (
          <>
            <div ref={resultRef} className="mb-4 flex items-center justify-between">
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                {(["recents", "community"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      activeTab === tab
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "recents" ? "Recents" : "Community"}
                  </button>
                ))}
              </div>
            </div>
            {activeTab === "recents" ? <RecentsGrid /> : <CommunityGrid />}
          </>
        )}
      </div>
    </div>
  );
}
