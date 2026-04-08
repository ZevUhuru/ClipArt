"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CreatePageLayout } from "@/components/CreatePageLayout";
import { useAppStore } from "@/stores/useAppStore";
import { useGenerationQueue } from "@/stores/useGenerationQueue";
import { COLORING_ASPECT_OPTIONS, type AspectRatio } from "@/lib/styles";
import { PromptBuilder, COLORING_BUILDER } from "@/components/prompt-builder";

export default function ColoringPagesCreatePage() {
  const [prompt, setPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4");
  const [error, setError] = useState<string | null>(null);

  const { openAuthModal, user } = useAppStore();
  const addJob = useGenerationQueue((s) => s.addJob);

  const style = "coloring" as const;

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    addJob(prompt.trim(), style, isPublic, {
      contentType: "coloring",
      aspectRatio,
    });
    setPrompt("");
  }, [prompt, style, isPublic, aspectRatio, user, openAuthModal, addJob]);

  const handleDraftChange = useCallback((draft: string) => {
    if (draft) setPrompt(draft);
  }, []);

  return (
    <CreatePageLayout
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={handleGenerate}
      promptPlaceholder="Describe your coloring page... (e.g. dinosaur in a jungle scene)"
      submitDisabled={!prompt.trim()}
      error={error}
      options={
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-0.5">
              {COLORING_ASPECT_OPTIONS.map((opt) => (
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
              href="/coloring-pages"
              className="text-xs font-medium text-pink-500 hover:text-pink-700"
            >
              Browse Coloring Pages
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
        </>
      }
    >
      <PromptBuilder
        config={COLORING_BUILDER}
        style={style}
        onDraftChange={handleDraftChange}
        onSelectSuggestion={setPrompt}
      />
    </CreatePageLayout>
  );
}
