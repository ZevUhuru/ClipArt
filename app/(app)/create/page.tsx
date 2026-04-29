"use client";

import { useState, useCallback } from "react";
import { CreatePageLayout } from "@/components/CreatePageLayout";
import { FilterPopover, type ChipItem } from "@/components/filters";
import { StyleIndicator } from "@/data/styleIndicators";
import { useAppStore } from "@/stores/useAppStore";
import { useGenerationQueue } from "@/stores/useGenerationQueue";
import { VALID_STYLES, STYLE_LABELS, type StyleKey } from "@/lib/styles";
import { PromptLibrary } from "@/components/PromptLibrary";

const CLIPART_STYLE_CHIPS: ChipItem[] = VALID_STYLES.clipart.map((key) => ({
  key,
  label: STYLE_LABELS[key] || key,
  indicator: <StyleIndicator styleKey={key} />,
}));

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleKey>("flat");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { openAuthModal, user } = useAppStore();
  const addJob = useGenerationQueue((s) => s.addJob);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    addJob(prompt.trim(), style, isPublic);
    setPrompt("");
  }, [prompt, style, isPublic, user, openAuthModal, addJob]);

  const handleLibrarySelect = useCallback((prompt: string, selectedStyle: StyleKey) => {
    setPrompt(prompt);
    setStyle(selectedStyle);
  }, []);

  return (
    <CreatePageLayout
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={handleGenerate}
      promptPlaceholder="Describe your clip art... (e.g. a happy sun wearing sunglasses)"
      submitDisabled={!prompt.trim()}
      error={error}
      options={
        <>
          <FilterPopover
            label="Style"
            items={CLIPART_STYLE_CHIPS}
            activeKey={style}
            onSelect={(key) => setStyle((key || "flat") as StyleKey)}
            hideAll
          />
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            aria-label={isPublic ? "Visibility: Public — tap to make private" : "Visibility: Private — tap to make public"}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-gray-100 sm:gap-2"
            title={isPublic ? "Your creation will be shared with the community" : "Your creation will be private"}
          >
            <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublic ? "bg-green-400" : "bg-gray-200"}`}>
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${isPublic ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
            </span>
            <span className="hidden text-gray-500 sm:inline">
              {isPublic ? "Public" : "Private"}
            </span>
          </button>
        </>
      }
    >
      <PromptLibrary onSelect={handleLibrarySelect} />
    </CreatePageLayout>
  );
}
