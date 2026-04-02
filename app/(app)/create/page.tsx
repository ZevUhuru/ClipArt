"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StylePicker } from "@/components/StylePicker";
import { CreateModeToggle } from "@/components/CreateModeToggle";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { createBrowserClient } from "@/lib/supabase/client";
import { ImageCard, ImageCardSkeleton } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { GenerationProgress } from "@/components/GenerationProgress";
import type { StyleKey } from "@/lib/styles";

const ANON_RESULT_KEY = "clip_art_anon_result";

interface AnonResult {
  imageUrl: string;
  prompt: string;
  style: string;
}

interface CommunityItem extends Generation {
  animationPreviewUrl?: string;
}

function CommunityGrid() {
  const openDrawer = useImageDrawer((s) => s.open);
  const storeGenerations = useAppStore((s) => s.generations);
  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function fetchCommunity() {
      const supabase = createBrowserClient();
      if (!supabase) return;

      const [genResult, animResult] = await Promise.all([
        supabase
          .from("generations")
          .select("id, image_url, prompt, style, category, slug, aspect_ratio, created_at")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("animations")
          .select(
            "id, prompt, video_url, preview_url, thumbnail_url, model, created_at, " +
            "source:generations!animations_source_generation_id_fkey(id, image_url, prompt, style, category, slug, aspect_ratio)",
          )
          .eq("status", "completed")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const gens: CommunityItem[] = (genResult.data || []).map((g) => g as CommunityItem);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const animCards: CommunityItem[] = (animResult.data || []).map((a: any) => {
        const src = a.source as Record<string, string> | null;
        return {
          id: `anim-${a.id}`,
          image_url: src?.image_url || a.thumbnail_url || "",
          prompt: src?.prompt || a.prompt,
          style: src?.style || "flat",
          category: src?.category || "free",
          slug: src?.slug || a.id,
          aspect_ratio: src?.aspect_ratio,
          created_at: a.created_at,
          animationPreviewUrl: a.preview_url || a.video_url,
        } as CommunityItem;
      });

      const merged: CommunityItem[] = [...gens];
      const usedAnimIds = new Set<string>();
      let animIdx = 0;
      for (let pos = 5; pos < merged.length + animCards.length && animIdx < animCards.length; pos += 7) {
        const anim = animCards[animIdx];
        if (!usedAnimIds.has(anim.id)) {
          merged.splice(pos, 0, anim);
          usedAnimIds.add(anim.id);
          animIdx++;
        }
      }
      while (animIdx < animCards.length) {
        if (!usedAnimIds.has(animCards[animIdx].id)) {
          merged.push(animCards[animIdx]);
        }
        animIdx++;
      }

      fetchedIdsRef.current = new Set(merged.map((m) => m.id));
      setCommunityItems(merged);
      setLoading(false);
    }

    fetchCommunity();
  }, []);

  const items = useMemo(() => {
    if (loading) return [];
    const newFromStore = storeGenerations.filter(
      (g) => g.id && g.image_url && !fetchedIdsRef.current.has(g.id),
    ) as CommunityItem[];
    if (newFromStore.length === 0) return communityItems;
    const combined = [...newFromStore, ...communityItems];
    newFromStore.forEach((g) => fetchedIdsRef.current.add(g.id));
    return combined;
  }, [storeGenerations, communityItems, loading]);

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
    category: gen.category || "free",
    style: gen.style,
    aspect_ratio: gen.aspect_ratio,
    videoUrl: gen.animationPreviewUrl,
  }));

  return (
    <ImageGrid>
      {safeItems.map((gen) => {
        const img = {
          id: gen.id,
          slug: gen.slug || gen.id,
          title: gen.prompt,
          url: gen.image_url,
          category: gen.category || "free",
          style: gen.style,
          aspect_ratio: gen.aspect_ratio,
          videoUrl: gen.animationPreviewUrl,
        };
        return (
          <ImageCard
            key={gen.id}
            image={img}
            onClick={() => openDrawer(img, drawerList)}
            animationPreviewUrl={gen.animationPreviewUrl}
          />
        );
      })}
    </ImageGrid>
  );
}

function AnonResultBanner({ result, onSignup }: { result: AnonResult; onSignup: () => void }) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
        <div className="w-full shrink-0 sm:w-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.imageUrl}
            alt={result.prompt}
            className="w-full rounded-xl shadow-md"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-500">
            Your free generation
          </p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">
            Looking great!
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            &ldquo;{result.prompt}&rdquo;
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Sign up to <span className="font-semibold">save this image</span> and get <span className="font-semibold text-pink-600">10 free credits</span> to create more.
          </p>
          <button
            onClick={onSignup}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Sign up &mdash; it&apos;s free
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("flat");
  const [isPublic, setIsPublic] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonResult, setAnonResult] = useState<AnonResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    openAuthModal,
    openBuyCreditsModal,
    setCredits,
    prependGeneration,
    user,
  } = useAppStore();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ANON_RESULT_KEY);
      if (raw) {
        setAnonResult(JSON.parse(raw));
        sessionStorage.removeItem(ANON_RESULT_KEY);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style, isPublic }),
      });

      const data = await res.json();

      if (res.status === 401 && data.requiresAuth) {
        openAuthModal("signup");
        return;
      }
      if (res.status === 402 && data.requiresCredits) {
        openBuyCreditsModal();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");

      if (typeof data.credits === "number") setCredits(data.credits);
      if (data.generation) prependGeneration(data.generation);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, isPublic, isGenerating, user, openAuthModal, openBuyCreditsModal, setCredits, prependGeneration]);

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
                placeholder="Describe your clip art... (e.g. a happy sun wearing sunglasses)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
                maxLength={1000}
                disabled={isGenerating}
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
              disabled={!prompt.trim() || isGenerating}
              className="shrink-0 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Creating…" : "Create"}
            </button>
          </div>

          {/* Style pills + share toggle */}
          <div className="mt-3 flex items-center justify-between">
            <StylePicker selected={style} onSelect={setStyle} />
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
        {/* Generation progress */}
        {isGenerating && (
          <div className="mb-6 flex justify-center">
            <GenerationProgress isGenerating={isGenerating} />
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

        {/* Anonymous free generation result */}
        {anonResult && !user && (
          <AnonResultBanner
            result={anonResult}
            onSignup={() => openAuthModal("signup")}
          />
        )}

        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          Community creations
        </p>

        <div ref={resultRef}>
          <CommunityGrid />
        </div>

        {/* Browse more clip art */}
        <div className="mt-12 rounded-2xl bg-white px-6 py-10 text-center">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            Browse thousands of free clip art
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Discover clip art for classrooms, worksheets, presentations, and more — all created by our community.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Browse clip art
          </Link>
        </div>
      </div>
    </div>
  );
}
