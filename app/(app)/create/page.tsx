"use client";

import { useState, useEffect, useCallback } from "react";
import { CreatePageLayout } from "@/components/CreatePageLayout";
import { RecentCreationsStrip } from "@/components/RecentCreationsStrip";
import { FilterPopover, type ChipItem } from "@/components/filters";
import { StyleIndicator } from "@/data/styleIndicators";
import { useAppStore } from "@/stores/useAppStore";
import { useGenerationQueue } from "@/stores/useGenerationQueue";
import { VALID_STYLES, STYLE_LABELS, type StyleKey } from "@/lib/styles";

const ANON_RESULT_KEY = "clip_art_anon_result";

const CLIPART_STYLE_CHIPS: ChipItem[] = VALID_STYLES.clipart.map((key) => ({
  key,
  label: STYLE_LABELS[key] || key,
  indicator: <StyleIndicator styleKey={key} />,
}));

const suggestedPrompts = [
  "a happy sun wearing sunglasses",
  "wedding couple throwing confetti",
  "cute cat playing piano",
  "birthday cake with candles",
  "teacher reading to students",
  "rocket ship blasting off",
];

interface AnonResult {
  imageUrl: string;
  prompt: string;
  style: string;
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
  const [error, setError] = useState<string | null>(null);
  const [anonResult, setAnonResult] = useState<AnonResult | null>(null);

  const { openAuthModal, user, generationsLoaded, generations } = useAppStore();
  const addJob = useGenerationQueue((s) => s.addJob);
  const queueJobs = useGenerationQueue((s) => s.jobs);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ANON_RESULT_KEY);
      if (raw) {
        setAnonResult(JSON.parse(raw));
        sessionStorage.removeItem(ANON_RESULT_KEY);
      }
    } catch { /* ignore parse errors */ }
  }, []);

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

  const clipartFilter = (g: { style: string; content_type?: string }) =>
    !g.content_type || g.content_type === "clipart";

  const hasRecents = generationsLoaded && generations.some((g) => g.id && g.image_url && clipartFilter(g));
  const showEmptyState = !user || (!hasRecents && queueJobs.length === 0);

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
      {anonResult && !user && (
        <AnonResultBanner
          result={anonResult}
          onSignup={() => openAuthModal("signup")}
        />
      )}

      {showEmptyState ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Create your first clip art
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Describe what you want and we&apos;ll generate it in seconds. Try one of these:
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
      ) : (
        <RecentCreationsStrip filterFn={clipartFilter} />
      )}
    </CreatePageLayout>
  );
}
