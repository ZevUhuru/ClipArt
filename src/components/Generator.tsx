"use client";

import { useRef, useState } from "react";
import { StylePicker } from "./StylePicker";
import { GenerationResult } from "./GenerationResult";
import { useAppStore } from "@/stores/useAppStore";
import { type StyleKey, STYLE_ASPECT_MAP } from "@/lib/styles";

export function Generator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("flat");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultAspectRatio, setResultAspectRatio] = useState<string>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { openAuthModal, openBuyCreditsModal, setCredits, prependGeneration, user } =
    useAppStore();

  async function handleGenerate() {
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

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setImageUrl(data.imageUrl);
      setResultAspectRatio(STYLE_ASPECT_MAP[style] || "1:1");

      if (typeof data.credits === "number") {
        setCredits(data.credits);
      }

      if (data.generation) {
        prependGeneration(data.generation);
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <label
          htmlFor="home-prompt"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs"
        >
          Your prompt
        </label>
        <div className="rounded-2xl border border-gray-200/90 bg-gradient-to-b from-gray-50 to-white p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.04)] sm:p-1">
          <textarea
            id="home-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. happy sun wearing sunglasses, flat mascot style"
            rows={2}
            className="min-h-[56px] w-full resize-none rounded-[0.875rem] border-0 bg-white/90 px-3 py-2.5 text-[15px] leading-snug text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/25 disabled:opacity-60 sm:min-h-[104px] sm:px-4 sm:py-3 sm:text-base"
            maxLength={500}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 sm:text-xs">
          <span className="hidden sm:inline">Shift + Enter for a new line.</span>
          <span className="sm:hidden">Shift + ↵ new line · Enter generates</span>
        </p>
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs">
          Style
        </span>
        <StylePicker selected={style} onSelect={setStyle} />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="btn-primary w-full py-3 text-sm sm:py-4 sm:text-base"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate"
        )}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
          {error}
        </p>
      )}

      <div ref={resultRef}>
        {imageUrl && <GenerationResult imageUrl={imageUrl} prompt={prompt} aspectRatio={resultAspectRatio} />}
      </div>
    </div>
  );
}
