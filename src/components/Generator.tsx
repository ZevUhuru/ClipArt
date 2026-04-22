"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StylePicker } from "./StylePicker";
import { GenerationResult } from "./GenerationResult";
import { GenerationProgress } from "./GenerationProgress";
import { useAppStore } from "@/stores/useAppStore";
import { type StyleKey, VALID_STYLES as ALL_VALID_STYLES, STYLE_ASPECT_MAP } from "@/lib/styles";

const CLIPART_STYLES = ALL_VALID_STYLES.clipart;
const FREE_GEN_KEY = "clip_art_free_gen";
const ANON_RESULT_KEY = "clip_art_anon_result";

export function Generator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("flat");
  const [hydrated, setHydrated] = useState(false);
  const [freeGenUsed, setFreeGenUsed] = useState(true);

  useEffect(() => {
    if (hydrated) return;
    const sp = searchParams.get("style");
    if (sp && CLIPART_STYLES.includes(sp as StyleKey)) {
      setStyle(sp as StyleKey);
    }
    const pp = searchParams.get("prompt");
    if (pp) {
      setPrompt(pp);
    }
    setFreeGenUsed(localStorage.getItem(FREE_GEN_KEY) === "1");
    setHydrated(true);
  }, [searchParams, hydrated]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultAspectRatio, setResultAspectRatio] = useState<string>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { openAuthModal, openBuyCreditsModal, setCredits, prependGeneration, user } =
    useAppStore();

  const canFreeGen = !user && !freeGenUsed;

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    if (!user && !canFreeGen) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setImageUrl(null);

    try {
      const payload: Record<string, unknown> = { prompt: prompt.trim(), style };
      if (canFreeGen) payload.freeGen = true;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      if (data.freeGen) {
        localStorage.setItem(FREE_GEN_KEY, "1");
        setFreeGenUsed(true);
        sessionStorage.setItem(
          ANON_RESULT_KEY,
          JSON.stringify({ imageUrl: data.imageUrl, prompt: prompt.trim(), style })
        );
        router.push("/create");
        return;
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

  const buttonLabel = isGenerating
    ? null
    : canFreeGen
      ? "Generate Now"
      : "Generate";

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
            maxLength={2000}
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
        {isGenerating ? "Creating…" : buttonLabel}
      </button>

      {canFreeGen && (
        <p className="text-center text-[11px] text-gray-400 sm:text-xs">
          No signup required for your first generation
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
          {error}
        </p>
      )}

      <div ref={resultRef}>
        <GenerationProgress isGenerating={isGenerating} />
        {imageUrl && <GenerationResult imageUrl={imageUrl} prompt={prompt} aspectRatio={resultAspectRatio} />}
      </div>
    </div>
  );
}
