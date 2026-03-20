"use client";

import { useState } from "react";
import { StylePicker } from "./StylePicker";
import { GenerationResult } from "./GenerationResult";
import { useAppStore } from "@/stores/useAppStore";
import type { StyleKey } from "@/lib/styles";

export function Generator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("flat");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { openAuthModal, openBuyCreditsModal, setCredits, user } =
    useAppStore();

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

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

      if (typeof data.credits === "number") {
        setCredits(data.credits);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your clip art... (e.g. a happy sun wearing sunglasses)"
        className="input-field min-h-[100px] resize-none"
        maxLength={500}
        disabled={isGenerating}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
          }
        }}
      />

      <StylePicker selected={style} onSelect={setStyle} />

      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="btn-primary w-full py-4 text-base"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
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
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {imageUrl && <GenerationResult imageUrl={imageUrl} prompt={prompt} />}
    </div>
  );
}
