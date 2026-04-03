"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { useAnimationQueue, type QueuedAnimation } from "@/stores/useAnimationQueue";
import { createBrowserClient } from "@/lib/supabase/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageImportModal, type ImportableImage } from "@/components/ImageImportModal";
import { AnimationQueue } from "@/components/AnimationQueue";
import {
  ANIMATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
} from "@/data/animationTemplates";

type AnimModel = "kling-2.5-turbo" | "kling-3.0-standard" | "kling-3.0-pro";

const MODELS: { id: AnimModel; label: string; credits: number; description: string }[] = [
  { id: "kling-2.5-turbo", label: "Fast", credits: 5, description: "Quick preview" },
  { id: "kling-3.0-standard", label: "Standard", credits: 8, description: "Best value" },
  { id: "kling-3.0-pro", label: "Pro", credits: 12, description: "Highest quality" },
];

interface PromptSuggestion {
  id?: string;
  title: string;
  prompt: string;
  use_count?: number;
  is_ai_generated?: boolean;
}

const SUGGESTION_STAGES = [
  { at: 0, msg: "Analyzing your image..." },
  { at: 15, msg: "Identifying subjects and composition..." },
  { at: 35, msg: "Crafting animation directions..." },
  { at: 60, msg: "Writing scene details..." },
  { at: 80, msg: "Polishing 5 unique prompts..." },
  { at: 95, msg: "Almost ready..." },
];

function useSuggestionProgress(startedAt: number, active: boolean) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!active || !startedAt) { setProgress(0); return; }

    function tick() {
      const elapsed = (Date.now() - startedAt) / 1000;
      let v: number;
      if (elapsed < 2) v = 15 * (elapsed / 2);
      else if (elapsed < 5) v = 15 + 25 * ((elapsed - 2) / 3);
      else if (elapsed < 10) v = 40 + 35 * ((elapsed - 5) / 5);
      else if (elapsed < 15) v = 75 + 18 * ((elapsed - 10) / 5);
      else v = 93 + 6 * (1 - Math.exp(-(elapsed - 15) / 8));
      setProgress(Math.min(v, 99));
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [startedAt, active]);

  const stage = SUGGESTION_STAGES.reduce(
    (acc, s) => (progress >= s.at ? s.msg : acc),
    SUGGESTION_STAGES[0].msg,
  );

  return { progress: Math.round(progress), stage };
}

function SuggestionsProgress({ startedAt }: { startedAt: number }) {
  const { progress, stage } = useSuggestionProgress(startedAt, true);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">{stage}</p>
        <span className="text-xs font-bold tabular-nums text-gray-400">{progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2.5 text-center text-[10px] text-gray-300">
        AI is studying your image to write tailored prompts
      </p>
    </div>
  );
}

function AnimatePageInner() {
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("id");
  const initialPrompt = searchParams.get("prompt") || "";

  const { user, openAuthModal, openBuyCreditsModal, setCredits } = useAppStore();
  const addJob = useAnimationQueue((s) => s.addJob);
  const queueJobs = useAnimationQueue((s) => s.jobs);

  const [source, setSource] = useState<ImportableImage | null>(null);
  const [sourceLoading, setSourceLoading] = useState(!!sourceId);
  const [importOpen, setImportOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState<AnimModel>("kling-3.0-standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsStarted, setSuggestionsStarted] = useState(0);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory | "all">("all");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const suggestionsCache = useRef<Map<string, PromptSuggestion[]>>(new Map());

  const selectedModel = MODELS.find((m) => m.id === model) || MODELS[1];

  const filteredTemplates =
    templateCategory === "all"
      ? ANIMATION_TEMPLATES
      : ANIMATION_TEMPLATES.filter((t) => t.category === templateCategory);

  const sourceJobs = source
    ? queueJobs.filter((j) => j.sourceUrl === source.url)
    : [];
  const latestCompleted = sourceJobs.find((j) => j.status === "completed");
  const activeVideoUrl = viewingVideo || latestCompleted?.videoUrl || null;

  useEffect(() => {
    if (!sourceId) return;

    async function loadSource() {
      setSourceLoading(true);
      const supabase = createBrowserClient();
      if (!supabase) return;

      const { data } = await supabase
        .from("generations")
        .select("id, image_url, title, slug, category, style, aspect_ratio")
        .eq("id", sourceId)
        .single();

      if (data) {
        setSource({
          id: data.id,
          url: data.image_url,
          title: data.title || "Untitled",
          slug: data.slug || data.id,
          category: data.category || "free",
          style: data.style || "flat",
          aspect_ratio: data.aspect_ratio,
        });
      }
      setSourceLoading(false);
    }

    loadSource();
  }, [sourceId]);

  const fetchSuggestions = useCallback(async (regenerate = false) => {
    if (!source || suggestionsLoading) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    const cacheKey = source.id;
    if (!regenerate && cacheKey && suggestionsCache.current.has(cacheKey)) {
      setSuggestions(suggestionsCache.current.get(cacheKey)!);
      return;
    }

    setSuggestionsLoading(true);
    setSuggestionsStarted(Date.now());
    setSuggestionsError(false);
    setSuggestions([]);
    setSelectedPromptId(null);

    try {
      const res = await fetch("/api/animate/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: source.url,
          generationId: source.id,
          regenerate,
        }),
      });

      if (res.status === 401) {
        openAuthModal("signup");
        setSuggestionsLoading(false);
        return;
      }

      const data = await res.json();
      const results: PromptSuggestion[] = data.suggestions || [];
      setSuggestions(results);
      if (cacheKey && results.length > 0) {
        suggestionsCache.current.set(cacheKey, results);
      }
    } catch {
      setSuggestionsError(true);
    }
    setSuggestionsLoading(false);
  }, [source, suggestionsLoading, user, openAuthModal]);

  const handleAnimate = useCallback(async () => {
    if (!prompt.trim() || submitting || !source) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: source.url,
          prompt: prompt.trim(),
          model,
          duration: 5,
          promptId: selectedPromptId || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401 && data.requiresAuth) {
        openAuthModal("signup");
        setSubmitting(false);
        return;
      }
      if (res.status === 402 && data.requiresCredits) {
        openBuyCreditsModal();
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Animation failed");

      if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);

      addJob({
        id: data.animationId,
        sourceUrl: source.url,
        sourceTitle: source.title,
        prompt: prompt.trim(),
        model,
        status: "processing",
        startedAt: Date.now(),
      });

      setPrompt("");
      setSelectedPromptId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSubmitting(false);
  }, [prompt, model, submitting, source, user, selectedPromptId, openAuthModal, openBuyCreditsModal, setCredits, addJob]);

  const handleViewResult = (job: QueuedAnimation) => {
    if (job.videoUrl) {
      setViewingVideo(job.videoUrl);
      setShowSource(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleRetry = useCallback(
    async (job: QueuedAnimation) => {
      if (!user) {
        openAuthModal("signup");
        return;
      }

      setError(null);

      try {
        const res = await fetch("/api/animate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceUrl: job.sourceUrl,
            prompt: job.prompt,
            model: job.model,
            duration: 5,
          }),
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
        if (!res.ok) throw new Error(data.error || "Animation failed");

        if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);

        addJob({
          id: data.animationId,
          sourceUrl: job.sourceUrl,
          sourceTitle: job.sourceTitle,
          prompt: job.prompt,
          model: job.model,
          status: "processing",
          startedAt: Date.now(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Retry failed");
      }
    },
    [user, openAuthModal, openBuyCreditsModal, setCredits, addJob],
  );

  const handleImport = (img: ImportableImage) => {
    setSource(img);
    setViewingVideo(null);
    setPrompt("");
    setError(null);
    setShowSource(false);
    setSuggestionsError(false);
    setSelectedPromptId(null);

    const cached = suggestionsCache.current.get(img.id);
    setSuggestions(cached || []);
  };

  if (sourceLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-400">Loading image...</p>
      </div>
    );
  }

  const aspectClass = source?.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Animation Studio</h1>
            <p className="text-xs text-gray-400">
              {source ? `Source: ${source.title}` : "Bring your clip art to life"}
            </p>
          </div>
          {source && (
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Change Image
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Canvas / Preview */}
          <div>
            <div
              ref={resultRef}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              {!source ? (
                <div className="flex aspect-square flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50">
                    <svg className="h-10 w-10 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Import an image to animate</h2>
                    <p className="mt-1 max-w-xs text-sm text-gray-400">
                      Choose from your creations or the community gallery to get started.
                    </p>
                  </div>
                  <button
                    onClick={() => setImportOpen(true)}
                    className="mt-1 flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import Image
                  </button>
                  <p className="text-xs text-gray-300">
                    Or use Edit/Animate on any image across the site
                  </p>
                </div>
              ) : activeVideoUrl && !showSource ? (
                <div className={`relative w-full ${aspectClass}`}>
                  <VideoPlayer
                    src={activeVideoUrl}
                    poster={source.url}
                    mode="detail"
                    className="absolute inset-0"
                  />
                </div>
              ) : (
                <div className={`relative w-full ${aspectClass}`}>
                  <Image
                    src={source.url}
                    alt={source.title}
                    fill
                    className="object-contain p-6"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {activeVideoUrl && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowSource(false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    !showSource ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Animation
                </button>
                <button
                  onClick={() => setShowSource(true)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    showSource ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Original
                </button>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="space-y-5">
            {!source ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">Import an image to see animation controls</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {ANIMATION_TEMPLATES.slice(0, 3).map((t) => (
                    <span key={t.id} className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-300">
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Motion prompt */}
                <div>
                  <label htmlFor="motion-prompt" className="mb-2 block text-sm font-semibold text-gray-700">
                    Describe the motion
                  </label>
                  <textarea
                    id="motion-prompt"
                    value={prompt}
                    onChange={(e) => { setPrompt(e.target.value); setSelectedPromptId(null); }}
                    placeholder="Describe how the image should move... or use AI suggestions below"
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder-gray-400 transition-all focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
                    rows={prompt.length > 200 ? 6 : prompt.length > 100 ? 4 : 3}
                    maxLength={1000}
                    disabled={submitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAnimate();
                      }
                    }}
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-300">
                    <span>Cmd+Enter to submit</span>
                    <span>{prompt.length}/1000</span>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      AI Suggestions
                    </p>
                    {suggestions.length > 0 && (
                      <button
                        onClick={() => fetchSuggestions(true)}
                        disabled={suggestionsLoading || submitting}
                        className="text-[11px] font-medium text-pink-500 transition-colors hover:text-pink-700 disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>

                  {suggestions.length === 0 && !suggestionsLoading ? (
                    <button
                      onClick={() => fetchSuggestions()}
                      disabled={suggestionsLoading || submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-white to-purple-50/30 px-4 py-3.5 text-sm font-medium text-gray-600 transition-all hover:border-pink-200 hover:from-pink-50/40 hover:to-purple-50/40 hover:text-pink-600 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                      Suggest prompts for this image
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        FREE
                      </span>
                    </button>
                  ) : suggestionsLoading ? (
                    <SuggestionsProgress startedAt={suggestionsStarted} />
                  ) : suggestionsError ? (
                    <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-center">
                      <p className="text-xs text-red-400">Failed to generate suggestions</p>
                      <button
                        onClick={() => fetchSuggestions()}
                        className="mt-1 text-xs font-medium text-pink-500 hover:text-pink-700"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                      {suggestions.map((s, i) => {
                        const isSelected = prompt === s.prompt;
                        return (
                          <button
                            key={s.id || i}
                            onClick={() => {
                              setPrompt(s.prompt);
                              setSelectedPromptId(s.id || null);
                            }}
                            disabled={submitting}
                            className={`group w-full rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-px hover:shadow-sm disabled:opacity-50 ${
                              isSelected
                                ? "border-pink-300 bg-pink-50 ring-1 ring-pink-100"
                                : "border-gray-100 bg-white hover:border-pink-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-bold ${isSelected ? "text-pink-700" : "text-gray-700"}`}>
                                {s.title}
                                {(s.use_count ?? 0) > 0 && (
                                  <span className="ml-1.5 text-[10px] font-normal text-gray-300">
                                    used {s.use_count}x
                                  </span>
                                )}
                              </p>
                              {isSelected && (
                                <span className="shrink-0 rounded-full bg-pink-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-pink-600">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className={`mt-1 text-[11px] leading-relaxed ${isSelected ? "text-pink-600/70" : "text-gray-400"}`}>
                              {s.prompt}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Templates */}
                <div>
                  <button
                    onClick={() => setTemplatesOpen(!templatesOpen)}
                    className="mb-2 flex w-full items-center justify-between"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Templates
                    </p>
                    <svg
                      className={`h-3.5 w-3.5 text-gray-400 transition-transform ${templatesOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {templatesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setTemplateCategory("all")}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                              templateCategory === "all"
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            All
                          </button>
                          {TEMPLATE_CATEGORIES.map((cat) => (
                            <button
                              key={cat.key}
                              onClick={() => setTemplateCategory(cat.key)}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                templateCategory === cat.key
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredTemplates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => { setPrompt(t.prompt); setSelectedPromptId(null); }}
                              disabled={submitting}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                                prompt === t.prompt
                                  ? "border-pink-300 bg-pink-50 text-pink-600"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Model selector */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Quality
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        disabled={submitting}
                        className={`relative rounded-xl border px-3 py-3 text-center transition-all ${
                          model === m.id
                            ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${model === m.id ? "text-pink-700" : "text-gray-700"}`}>
                          {m.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{m.description}</p>
                        <p className={`mt-1 text-xs font-bold ${model === m.id ? "text-pink-600" : "text-gray-500"}`}>
                          {m.credits} credits
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animate button */}
                <button
                  onClick={handleAnimate}
                  disabled={!prompt.trim() || submitting}
                  className="w-full rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : `Animate — ${selectedModel.credits} credits`}
                </button>

                <p className="text-center text-xs text-gray-300">
                  5-second MP4 video. Duration: ~1–2 minutes. Queue multiple at once.
                </p>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Result actions for viewed video */}
                {activeVideoUrl && source && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                      Animation complete
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={activeVideoUrl}
                        download={`${source.slug}-animation.mp4`}
                        className="btn-primary flex items-center justify-center py-3 text-sm"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download MP4
                      </a>
                      <Link
                        href="/my-art"
                        className="btn-secondary flex items-center justify-center py-3 text-sm"
                      >
                        My Creations
                      </Link>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Animation Queue — full width, below the fold */}
        {queueJobs.length > 0 && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <AnimationQueue onViewResult={handleViewResult} onRetry={handleRetry} />
          </div>
        )}
      </div>

      <ImageImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSelect={handleImport}
      />
    </div>
  );
}

export default function AnimatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      }
    >
      <AnimatePageInner />
    </Suspense>
  );
}
