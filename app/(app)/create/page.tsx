"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { StylePicker } from "@/components/StylePicker";
import { GenerationResult } from "@/components/GenerationResult";
import { useAppStore } from "@/stores/useAppStore";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { downloadClip } from "@/utils/downloadClip";
import type { StyleKey } from "@/lib/styles";

interface CommunityImage {
  id: string;
  slug: string;
  title: string;
  url: string;
  category: string;
  style: string;
}

function CommunityFeed() {
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const openDrawer = useImageDrawer((s) => s.open);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/search?category=free&limit=30");
        const data = await res.json();
        setImages(data.results || []);
      } catch {
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl">
            <div className="aspect-square bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="card group cursor-pointer overflow-hidden"
          onClick={() => openDrawer(img)}
        >
          <div className="relative aspect-square bg-gray-50">
            <Image
              src={img.url}
              alt={img.title}
              fill
              className="object-contain p-3 transition-transform group-hover:scale-105"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
              {img.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadClip(img.url, `clip-art-${img.id}.png`);
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { openAuthModal, openBuyCreditsModal, setCredits, prependGeneration, user } =
    useAppStore();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setImageUrl(null);

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

      setImageUrl(data.imageUrl);

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

        {/* Generation result */}
        <div ref={resultRef}>
          <AnimatePresence>
            {imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="mx-auto max-w-md">
                  <GenerationResult imageUrl={imageUrl} prompt={prompt} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Community feed */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Community Creations
          </h2>
        </div>
        <CommunityFeed />
      </div>
    </div>
  );
}
