"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StylePicker } from "@/components/StylePicker";
import { useAppStore, type Generation } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { createBrowserClient } from "@/lib/supabase/client";
import { downloadClip } from "@/utils/downloadClip";
import type { StyleKey } from "@/lib/styles";

const suggestedPrompts = [
  "a happy sun wearing sunglasses",
  "cute cat holding a book",
  "baby elephant with a birthday hat",
  "rainbow unicorn with stars",
  "friendly robot waving hello",
  "puppy playing in autumn leaves",
];

function RecentsGrid() {
  const { user, generations, generationsLoaded, setGenerations } = useAppStore();
  const openDrawer = useImageDrawer((s) => s.open);

  useEffect(() => {
    if (!user || generationsLoaded) return;

    async function fetchGenerations() {
      const supabase = createBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("generations")
        .select("id, image_url, prompt, style, category, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      setGenerations(data || []);
    }

    fetchGenerations();
  }, [user, generationsLoaded, setGenerations]);

  if (!generationsLoaded && user) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl">
            <div className="aspect-square bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (generations.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {generations.map((gen) => (
        <div
          key={gen.id}
          className="card group cursor-pointer overflow-hidden"
          onClick={() =>
            openDrawer({
              id: gen.id,
              slug: gen.slug || gen.id,
              title: gen.prompt,
              url: gen.image_url,
              category: gen.category || "free",
              style: gen.style,
            })
          }
        >
          <div className="relative aspect-square bg-gray-50">
            <Image
              src={gen.image_url}
              alt={gen.prompt}
              fill
              className="object-contain p-3 transition-transform group-hover:scale-105"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
              {gen.prompt}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadClip(gen.image_url, `clip-art-${gen.id}.png`);
              }}
              className="ml-2 shrink-0 text-xs font-medium text-pink-600 opacity-0 transition-opacity group-hover:opacity-100"
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("flat");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    openAuthModal,
    openBuyCreditsModal,
    setCredits,
    prependGeneration,
    user,
    generations,
    generationsLoaded,
  } = useAppStore();

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
        body: JSON.stringify({ prompt: prompt.trim(), style }),
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
  }, [prompt, style, isGenerating, user, openAuthModal, openBuyCreditsModal, setCredits, prependGeneration]);

  const hasRecents = generationsLoaded && generations.length > 0;
  const showEmptyState = !user || (generationsLoaded && generations.length === 0);

  return (
    <div className="min-h-screen">
      {/* Compact generator bar */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4">
          {/* Input row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your clip art... (e.g. a happy sun wearing sunglasses)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
                maxLength={500}
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
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </button>
          </div>

          {/* Style pills */}
          <div className="mt-3">
            <StylePicker selected={style} onSelect={setStyle} />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto max-w-5xl px-4 py-6">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Create your first clip art
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              Describe what you want and our AI generates it in seconds. Try one of these to get started:
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
            <div className="mt-8">
              <Link
                href="/search"
                className="text-sm text-gray-400 transition-colors hover:text-gray-600"
              >
                Or browse community creations →
              </Link>
            </div>
          </div>
        )}

        {/* Recents grid */}
        {!showEmptyState && (
          <>
            <div ref={resultRef} className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Recents
              </h2>
              <Link
                href="/my-art"
                className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                View all →
              </Link>
            </div>
            <RecentsGrid />
          </>
        )}
      </div>
    </div>
  );
}
