"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { AnimationProgress } from "@/components/AnimationProgress";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageImportModal, type ImportableImage } from "@/components/ImageImportModal";

type AnimModel = "kling-2.5-turbo" | "kling-3.0-standard" | "kling-3.0-pro";

const MODELS: { id: AnimModel; label: string; credits: number; description: string }[] = [
  { id: "kling-2.5-turbo", label: "Fast", credits: 5, description: "Quick preview" },
  { id: "kling-3.0-standard", label: "Standard", credits: 8, description: "Best value" },
  { id: "kling-3.0-pro", label: "Pro", credits: 12, description: "Highest quality" },
];

const MOTION_PRESETS = [
  { label: "Gentle idle", instruction: "Gentle breathing idle animation, subtle movement" },
  { label: "Wave hello", instruction: "Character waves hello and smiles" },
  { label: "Slow zoom", instruction: "Camera slowly zooms in with soft focus" },
  { label: "Bouncing", instruction: "Bouncing and bobbing playful motion" },
  { label: "Turn around", instruction: "Character turns around slowly" },
];

function AnimatePageInner() {
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("id");

  const { user, openAuthModal, openBuyCreditsModal, setCredits } = useAppStore();

  const [source, setSource] = useState<ImportableImage | null>(null);
  const [sourceLoading, setSourceLoading] = useState(!!sourceId);
  const [importOpen, setImportOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<AnimModel>("kling-3.0-standard");
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationId, setAnimationId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedModel = MODELS.find((m) => m.id === model) || MODELS[1];

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

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/animate/status?id=${id}`);
        const data = await res.json();

        if (data.status === "completed" && data.videoUrl) {
          stopPolling();
          setVideoUrl(data.videoUrl);
          setIsAnimating(false);
          setShowSource(false);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        } else if (data.status === "failed") {
          stopPolling();
          setIsAnimating(false);
          setError(data.error || "Animation failed. Credits have been refunded.");
        }
      } catch {
        // Silently retry on next poll
      }
    }, 5000);
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleAnimate = useCallback(async () => {
    if (!prompt.trim() || isAnimating || !source) return;

    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    setIsAnimating(true);
    setVideoUrl(null);
    setAnimationId(null);

    try {
      const res = await fetch("/api/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: source.url,
          prompt: prompt.trim(),
          model,
          duration: 5,
        }),
      });

      const data = await res.json();

      if (res.status === 401 && data.requiresAuth) {
        openAuthModal("signup");
        setIsAnimating(false);
        return;
      }
      if (res.status === 402 && data.requiresCredits) {
        openBuyCreditsModal();
        setIsAnimating(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Animation failed");

      if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);

      setAnimationId(data.animationId);
      startPolling(data.animationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsAnimating(false);
    }
  }, [prompt, model, isAnimating, source, user, openAuthModal, openBuyCreditsModal, setCredits, startPolling]);

  const handleAnimateAgain = () => {
    setVideoUrl(null);
    setAnimationId(null);
    setPrompt("");
    setError(null);
  };

  const handleImport = (img: ImportableImage) => {
    setSource(img);
    setVideoUrl(null);
    setAnimationId(null);
    setPrompt("");
    setError(null);
    setShowSource(false);
  };

  if (sourceLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
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
              disabled={isAnimating}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
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
                /* ── Empty canvas state ── */
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
              ) : videoUrl && !showSource ? (
                <div className={`relative w-full ${aspectClass}`}>
                  <VideoPlayer
                    src={videoUrl}
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

            {videoUrl && (
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
              /* ── Empty controls hint ── */
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">Import an image to see animation controls</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {MOTION_PRESETS.slice(0, 3).map((p) => (
                    <span key={p.label} className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-300">
                      {p.label}
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
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how the image should move... (e.g. character waves hello and smiles)"
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
                    rows={3}
                    maxLength={1000}
                    disabled={isAnimating}
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

                {/* Motion presets */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Quick motions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MOTION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setPrompt(preset.instruction)}
                        disabled={isAnimating}
                        className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 disabled:opacity-50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
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
                        disabled={isAnimating}
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
                  disabled={!prompt.trim() || isAnimating}
                  className="w-full rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnimating ? "Animating…" : `Animate — ${selectedModel.credits} credits`}
                </button>

                <p className="text-center text-xs text-gray-300">
                  5-second MP4 video. Duration: ~1–2 minutes.
                </p>

                {/* Progress */}
                {isAnimating && (
                  <div className="flex justify-center">
                    <AnimationProgress isAnimating={isAnimating} />
                  </div>
                )}

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

                {/* Result actions */}
                {videoUrl && (
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
                        href={videoUrl}
                        download={`${source.slug}-animation.mp4`}
                        className="btn-primary flex items-center justify-center py-3 text-sm"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download MP4
                      </a>
                      <button
                        onClick={handleAnimateAgain}
                        className="btn-secondary py-3 text-sm"
                      >
                        Animate Again
                      </button>
                    </div>
                    <Link
                      href="/my-art"
                      className="block text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
                    >
                      View in My Creations →
                    </Link>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
        </div>
      }
    >
      <AnimatePageInner />
    </Suspense>
  );
}
