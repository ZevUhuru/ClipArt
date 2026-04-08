"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { useAnimationQueue, type QueuedAnimation } from "@/stores/useAnimationQueue";
import { createBrowserClient } from "@/lib/supabase/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageImportModal, type ImportableImage } from "@/components/ImageImportModal";
import { AnimationQueue } from "@/components/AnimationQueue";
import { SharePopover } from "@/components/SharePopover";
import { UploadModal } from "@/components/UploadModal";
import {
  ANIMATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
} from "@/data/animationTemplates";

type AnimModel = "kling-2.5-turbo" | "kling-3.0-standard" | "kling-3.0-pro";

interface AnimatePreset {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceThumb: string;
  prompt: string;
  model: string;
  duration: number;
  audio: boolean;
  savedAt: number;
}

const PRESETS_KEY = "animate:presets";
const DRAFT_KEY = "animate:draft";
const MAX_PRESETS = 10;

function loadPresets(): AnimatePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? (JSON.parse(raw) as AnimatePreset[]) : [];
  } catch { return []; }
}

function savePreset(preset: Omit<AnimatePreset, "id" | "savedAt">) {
  try {
    const existing = loadPresets();
    const dupe = existing.findIndex(
      (p) => p.sourceId === preset.sourceId && p.prompt === preset.prompt,
    );
    if (dupe !== -1) existing.splice(dupe, 1);
    const entry: AnimatePreset = {
      ...preset,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      savedAt: Date.now(),
    };
    const updated = [entry, ...existing].slice(0, MAX_PRESETS);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  } catch { /* quota exceeded */ }
}

function removePreset(id: string) {
  try {
    const updated = loadPresets().filter((p) => p.id !== id);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

const MODELS: { id: AnimModel; label: string; description: string }[] = [
  { id: "kling-2.5-turbo", label: "Fast", description: "Quick preview" },
  { id: "kling-3.0-standard", label: "Standard", description: "Best value" },
  { id: "kling-3.0-pro", label: "Pro", description: "Highest quality" },
];

const BASE_CREDITS_PER_SEC: Record<AnimModel, number> = {
  "kling-2.5-turbo": 1,
  "kling-3.0-standard": 1.6,
  "kling-3.0-pro": 2.4,
};

const MODEL_MAX_DURATION: Record<AnimModel, number> = {
  "kling-2.5-turbo": 10,
  "kling-3.0-standard": 15,
  "kling-3.0-pro": 15,
};

const MODEL_AUDIO_SUPPORTED: Record<AnimModel, boolean> = {
  "kling-2.5-turbo": false,
  "kling-3.0-standard": true,
  "kling-3.0-pro": true,
};

function calcCredits(model: AnimModel, duration: number, audio: boolean): number {
  const base = Math.round(BASE_CREDITS_PER_SEC[model] * duration);
  const safeAudio = audio && MODEL_AUDIO_SUPPORTED[model];
  return safeAudio ? Math.round(base * 1.5) : base;
}

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
  const router = useRouter();
  const sourceId = searchParams.get("id");
  const initialPrompt = searchParams.get("prompt") || "";

  const { user, openAuthModal, openBuyCreditsModal, setCredits } = useAppStore();
  const addJob = useAnimationQueue((s) => s.addJob);
  const queueJobs = useAnimationQueue((s) => s.jobs);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const draft = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed.sourceId === sourceId ? parsed : null;
    } catch { return null; }
  }, [sourceId]);

  const [source, setSource] = useState<ImportableImage | null>(null);
  const [sourceLoading, setSourceLoading] = useState(!!sourceId);
  const [importOpen, setImportOpen] = useState(false);
  const [prompt, setPrompt] = useState(() => initialPrompt || draft?.prompt || "");
  const [model, setModel] = useState<AnimModel>(() => draft?.model || "kling-3.0-standard");
  const [duration, setDuration] = useState(() => typeof draft?.duration === "number" ? draft.duration : 5);
  const [audio, setAudio] = useState(() => draft?.audio === true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [viewingPoster, setViewingPoster] = useState<string | null>(null);
  const [viewingAnimationId, setViewingAnimationId] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsStarted, setSuggestionsStarted] = useState(0);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory | "all">("all");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [presets, setPresets] = useState<AnimatePreset[]>(() => loadPresets());
  const suggestionsCache = useRef<Map<string, PromptSuggestion[]>>(new Map());

  const maxDuration = MODEL_MAX_DURATION[model];
  const audioSupported = MODEL_AUDIO_SUPPORTED[model];
  const totalCredits = useMemo(() => calcCredits(model, duration, audio), [model, duration, audio]);

  useEffect(() => {
    if (duration > maxDuration) setDuration(maxDuration);
  }, [model, duration, maxDuration]);

  useEffect(() => {
    if (!audioSupported && audio) setAudio(false);
  }, [model, audioSupported, audio]);

  // Continuously persist form state to localStorage (debounced)
  useEffect(() => {
    const currentSourceId = source?.id || sourceId;
    if (!currentSourceId) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          sourceId: currentSourceId,
          prompt,
          model,
          duration,
          audio: audio && audioSupported,
        }));
      } catch { /* quota exceeded — non-critical */ }
    }, 500);

    return () => clearTimeout(timer);
  }, [source, sourceId, prompt, model, duration, audio, audioSupported]);

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

    const cacheKey = `${source.id}:${duration}`;
    if (!regenerate && suggestionsCache.current.has(cacheKey)) {
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
          duration,
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
  }, [source, duration, suggestionsLoading, user, openAuthModal]);

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
          duration,
          audio: audio && audioSupported,
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
        duration,
        audio: audio && audioSupported,
        status: "processing",
        startedAt: Date.now(),
      });

      savePreset({
        sourceId: source.id,
        sourceTitle: source.title,
        sourceThumb: source.url,
        prompt: prompt.trim(),
        model,
        duration,
        audio: audio && audioSupported,
      });
      setPresets(loadPresets());

      setPrompt("");
      setSelectedPromptId(null);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSubmitting(false);
  }, [prompt, model, duration, audio, audioSupported, submitting, source, user, selectedPromptId, sourceId, openAuthModal, openBuyCreditsModal, setCredits, addJob]);

  const handleViewResult = (job: QueuedAnimation) => {
    if (job.videoUrl) {
      setViewingVideo(job.videoUrl);
      setViewingPoster(job.sourceUrl);
      setViewingAnimationId(job.id);
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
            duration: job.duration || 5,
            audio: job.audio || false,
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
          duration: job.duration || 5,
          audio: job.audio || false,
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
    setViewingPoster(null);
    setPrompt("");
    setError(null);
    setShowSource(false);
    setSuggestionsError(false);
    setSelectedPromptId(null);

    const cached = suggestionsCache.current.get(`${img.id}:${duration}`);
    setSuggestions(cached || []);

    router.replace(`/animate?id=${img.id}`, { scroll: false });
  };

  const handleStartOver = () => {
    if (source && prompt.trim()) {
      savePreset({
        sourceId: source.id,
        sourceTitle: source.title,
        sourceThumb: source.url,
        prompt: prompt.trim(),
        model,
        duration,
        audio: audio && audioSupported,
      });
      setPresets(loadPresets());
    }

    setSource(null);
    setViewingVideo(null);
    setViewingPoster(null);
    setViewingAnimationId(null);
    setPrompt("");
    setModel("kling-3.0-standard");
    setDuration(5);
    setAudio(false);
    setError(null);
    setShowSource(false);
    setSuggestions([]);
    setSuggestionsError(false);
    setSelectedPromptId(null);
    setTemplateCategory("all");
    setTemplatesOpen(false);
    suggestionsCache.current.clear();
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    router.replace("/animate", { scroll: false });
  };

  if (sourceLoading) {
    return (
      <div className="min-h-screen lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:flex lg:flex-1 lg:flex-col lg:overflow-hidden">
          <div className="mb-6 shrink-0">
            <div className="h-5 w-40 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-3 w-56 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
            <div className="aspect-square animate-pulse rounded-2xl bg-gray-200 lg:self-start" />
            <div className="space-y-5 lg:overflow-y-auto">
              <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
                <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
              </div>
              <div className="h-8 animate-pulse rounded-full bg-gray-100" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const aspectClass = source?.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square";
  const sliderPercent = ((duration - 5) / (maxDuration - 5)) * 100;

  return (
    <div className="min-h-screen lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:flex lg:flex-1 lg:flex-col lg:overflow-hidden">
        {/* Header */}
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Animation Studio</h1>
            <p className="text-xs text-gray-400">
              {source ? `Source: ${source.title}` : "Bring your clip art to life"}
            </p>
          </div>
          {source && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Change Image
              </button>
              <button
                onClick={handleStartOver}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
          {/* Left: Canvas / Preview */}
          <div className="lg:self-start">
            <div
              ref={resultRef}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              {!source && viewingVideo ? (
                <div className="relative aspect-square w-full">
                  <VideoPlayer
                    key={viewingVideo}
                    src={viewingVideo}
                    poster={viewingPoster || undefined}
                    autoPlay
                    mode="detail"
                    className="absolute inset-0"
                  />
                </div>
              ) : !source ? (
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
                    key={activeVideoUrl}
                    src={activeVideoUrl}
                    poster={viewingVideo ? (viewingPoster || source.url) : source.url}
                    autoPlay={!!viewingVideo}
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

            {activeVideoUrl && source && (
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
          <div className="space-y-5 lg:overflow-y-auto lg:pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {!source ? (
              <div className="space-y-5">
                {/* Recent Setups — prominent on empty state */}
                {presets.length > 0 && (
                  <div>
                    <button
                      onClick={() => setPresetsOpen(!presetsOpen)}
                      className="mb-2 flex w-full items-center justify-between"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Recent Setups
                      </p>
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${presetsOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {presetsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2">
                            {presets.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  router.replace(`/animate?id=${p.sourceId}`, { scroll: false });
                                  setPrompt(p.prompt);
                                  setModel(p.model as AnimModel);
                                  setDuration(p.duration);
                                  setAudio(p.audio);
                                  try {
                                    localStorage.setItem(DRAFT_KEY, JSON.stringify({
                                      sourceId: p.sourceId,
                                      prompt: p.prompt,
                                      model: p.model,
                                      duration: p.duration,
                                      audio: p.audio,
                                    }));
                                  } catch { /* ignore */ }
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-pink-200 hover:bg-pink-50/30"
                              >
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.sourceThumb} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-gray-700 group-hover:text-pink-700">
                                    {p.prompt}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                                    <span>{MODELS.find((m) => m.id === p.model)?.label || "Standard"}</span>
                                    <span>·</span>
                                    <span>{p.duration}s</span>
                                    {p.audio && <><span>·</span><span>Audio</span></>}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePreset(p.id);
                                    setPresets(loadPresets());
                                  }}
                                  className="shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!presetsOpen && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {presets.slice(0, 4).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              router.replace(`/animate?id=${p.sourceId}`, { scroll: false });
                              setPrompt(p.prompt);
                              setModel(p.model as AnimModel);
                              setDuration(p.duration);
                              setAudio(p.audio);
                              try {
                                localStorage.setItem(DRAFT_KEY, JSON.stringify({
                                  sourceId: p.sourceId,
                                  prompt: p.prompt,
                                  model: p.model,
                                  duration: p.duration,
                                  audio: p.audio,
                                }));
                              } catch { /* ignore */ }
                            }}
                            className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 transition-all hover:border-pink-200 hover:bg-pink-50/30"
                          >
                            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.sourceThumb} alt="" className="h-full w-full object-cover" />
                            </div>
                            <span className="max-w-[120px] truncate text-[11px] font-medium text-gray-600">
                              {p.prompt}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Disabled controls preview */}
                <div className="pointer-events-none space-y-5 opacity-50">
                  {/* Motion prompt preview */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Describe the motion
                    </label>
                    <textarea
                      disabled
                      placeholder="Describe how the image should move... or use AI suggestions below"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder-gray-400"
                      rows={3}
                    />
                  </div>

                  {/* Templates preview */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Templates
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ANIMATION_TEMPLATES.slice(0, 6).map((t) => (
                        <span key={t.id} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                          {t.label}
                        </span>
                      ))}
                      <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-400">
                        +{ANIMATION_TEMPLATES.length - 6} more
                      </span>
                    </div>
                  </div>

                  {/* Quality preview */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Quality
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {MODELS.map((m) => {
                        const isDefault = m.id === "kling-3.0-standard";
                        return (
                          <div
                            key={m.id}
                            className={`rounded-xl border px-3 py-3 text-center ${
                              isDefault ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100" : "border-gray-200 bg-white"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${isDefault ? "text-pink-700" : "text-gray-700"}`}>
                              {m.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-400">{m.description}</p>
                            <p className={`mt-1 text-xs font-bold ${isDefault ? "text-pink-600" : "text-gray-500"}`}>
                              {calcCredits(m.id, 5, false)} credits
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration preview */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Duration</p>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-gray-700">5s</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-gray-100">
                      <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-400" />
                    </div>
                  </div>

                  {/* Audio preview */}
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Native Audio</p>
                        <p className="text-[10px] text-gray-400">AI generates sound effects and voice</p>
                      </div>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                      <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>

                  {/* Animate button preview */}
                  <div className="rounded-xl bg-brand-gradient px-6 py-3.5 text-center text-sm font-bold text-white shadow-md">
                    Select an image to animate
                  </div>
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

                {/* Recent Setups (collapsed inline when source is loaded) */}
                {presets.length > 0 && (
                  <div>
                    <button
                      onClick={() => setPresetsOpen(!presetsOpen)}
                      className="mb-2 flex w-full items-center justify-between"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Recent Setups
                      </p>
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${presetsOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {presetsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2">
                            {presets.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  router.replace(`/animate?id=${p.sourceId}`, { scroll: false });
                                  setPrompt(p.prompt);
                                  setModel(p.model as AnimModel);
                                  setDuration(p.duration);
                                  setAudio(p.audio);
                                  setPresetsOpen(false);
                                  try {
                                    localStorage.setItem(DRAFT_KEY, JSON.stringify({
                                      sourceId: p.sourceId,
                                      prompt: p.prompt,
                                      model: p.model,
                                      duration: p.duration,
                                      audio: p.audio,
                                    }));
                                  } catch { /* ignore */ }
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-pink-200 hover:bg-pink-50/30"
                              >
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.sourceThumb} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-gray-700 group-hover:text-pink-700">
                                    {p.prompt}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                                    <span>{MODELS.find((m) => m.id === p.model)?.label || "Standard"}</span>
                                    <span>·</span>
                                    <span>{p.duration}s</span>
                                    {p.audio && <><span>·</span><span>Audio</span></>}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePreset(p.id);
                                    setPresets(loadPresets());
                                  }}
                                  className="shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Model selector */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Quality
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {MODELS.map((m) => {
                      const isActive = model === m.id;
                      const modelCredits = calcCredits(m.id, Math.min(duration, MODEL_MAX_DURATION[m.id]), audio && MODEL_AUDIO_SUPPORTED[m.id]);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setModel(m.id)}
                          disabled={submitting}
                          className={`relative rounded-xl border px-3 py-3 text-center transition-all ${
                            isActive
                              ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <p className={`text-sm font-semibold ${isActive ? "text-pink-700" : "text-gray-700"}`}>
                            {m.label}
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-400">{m.description}</p>
                          <p className={`mt-1 text-xs font-bold ${isActive ? "text-pink-600" : "text-gray-500"}`}>
                            {modelCredits} credits
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration slider */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Duration
                    </p>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-gray-700">
                      {duration}s
                    </span>
                  </div>
                  <div className="relative px-0.5">
                    <div className="relative h-2 rounded-full bg-gray-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                        style={{ width: `${sliderPercent}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={maxDuration}
                      step={1}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      disabled={submitting}
                      className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-pink-500 [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-gray-300">
                    <span>5s</span>
                    {maxDuration >= 10 && <span>10s</span>}
                    <span>{maxDuration}s</span>
                  </div>
                </div>

                {/* Audio toggle */}
                <div
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    audio && audioSupported
                      ? "border-purple-200 bg-purple-50/50"
                      : "border-gray-200 bg-white"
                  } ${!audioSupported ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className={`h-5 w-5 ${audio && audioSupported ? "text-purple-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    <div>
                      <p className={`text-sm font-semibold ${audio && audioSupported ? "text-purple-700" : "text-gray-700"}`}>
                        Native Audio
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {audioSupported ? "AI generates sound effects and voice" : "Not available with Fast model"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => audioSupported && setAudio(!audio)}
                    disabled={submitting || !audioSupported}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                      audio && audioSupported ? "bg-purple-500" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={audio && audioSupported}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        audio && audioSupported ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Animate button */}
                <button
                  onClick={handleAnimate}
                  disabled={!prompt.trim() || submitting}
                  className="w-full rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : `Animate — ${totalCredits} credits`}
                </button>

                <p className="text-center text-xs text-gray-300">
                  {duration}-second MP4{audio && audioSupported ? " with audio" : ""}. Duration: ~1–{Math.max(2, Math.ceil(duration / 3))} minutes. Queue multiple at once.
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
                {activeVideoUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                      Animation complete
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = `/api/download?url=${encodeURIComponent(activeVideoUrl!)}`;
                          a.download = `${source?.slug || "clip-art"}-animation.mp4`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="btn-primary flex items-center justify-center py-3 text-sm"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download MP4
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setSharePopoverOpen(!sharePopoverOpen)}
                          className="btn-secondary flex w-full items-center justify-center gap-1.5 py-3 text-sm"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </button>
                        {sharePopoverOpen && (
                          <SharePopover
                            url={`/animations/${latestCompleted?.id || ""}`}
                            title={source?.title || prompt || "Clip Art Animation"}
                            onClose={() => setSharePopoverOpen(false)}
                          />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Upload to YouTube
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Animation Queue — full-bleed dark footer, pinned to bottom */}
      {queueJobs.length > 0 && (
        <div className="relative z-30 shrink-0 bg-[#1c1c27] pt-4 pb-3 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
          <div className="mx-auto max-w-6xl px-4">
            <AnimationQueue onViewResult={handleViewResult} onRetry={handleRetry} />
          </div>
        </div>
      )}

      <ImageImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSelect={handleImport}
      />

      <AnimatePresence>
        {uploadOpen && activeVideoUrl && (
          <UploadModal
            animation={{
              id: viewingAnimationId || latestCompleted?.id || "",
              title: source?.title || prompt || "Clip Art Animation",
              prompt: prompt || source?.title || "",
              category: source?.category || "free",
              videoUrl: activeVideoUrl,
              thumbnailUrl: source?.url || undefined,
            }}
            onClose={() => setUploadOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnimatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:flex lg:flex-1 lg:flex-col lg:overflow-hidden">
            <div className="mb-6 shrink-0">
              <div className="h-5 w-40 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-2 h-3 w-56 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
              <div className="aspect-square animate-pulse rounded-2xl bg-gray-200 lg:self-start" />
              <div className="space-y-5 lg:overflow-y-auto">
                <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
                <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AnimatePageInner />
    </Suspense>
  );
}
