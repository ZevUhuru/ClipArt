"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { internalToSlug } from "@/data/categories";
import { downloadClip } from "@/utils/downloadClip";
import { SharePopover } from "@/components/SharePopover";
import { UploadModal } from "@/components/UploadModal";
import { AttributionSection } from "@/components/AttributionSection";

function getCategorySlug(category: string): string {
  return internalToSlug[category] || "free";
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ImageDetailDrawer() {
  const image = useImageDrawer((s) => s.image);
  const close = useImageDrawer((s) => s.close);
  const next = useImageDrawer((s) => s.next);
  const prev = useImageDrawer((s) => s.prev);
  const hasNext = useImageDrawer((s) => s.hasNext);
  const hasPrev = useImageDrawer((s) => s.hasPrev);
  const isOwner = useImageDrawer((s) => s.isOwner);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && hasNext()) next();
      if (e.key === "ArrowLeft" && hasPrev()) prev();
    },
    [close, next, prev, hasNext, hasPrev],
  );

  useEffect(() => {
    if (!image) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [image, handleKeyDown]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100) close();
  };

  if (!image) return null;

  const contentType = image.content_type;
  const isColoring = contentType === "coloring" || image.style === "coloring";
  const isIllustration = contentType === "illustration";
  const isAnimation = !!image.videoUrl;
  const categorySlug = getCategorySlug(image.category);
  const detailHref = isAnimation
    ? `/animations/${image.slug}`
    : isColoring
      ? `/coloring-pages/${image.category}/${image.slug}`
      : isIllustration
        ? `/illustrations/${image.category}/${image.slug}`
        : `/${categorySlug}/${image.slug}`;

  const canPrev = hasPrev();
  const canNext = hasNext();

  return (
    <AnimatePresence>
      {image && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={close}
          />

          {/* Desktop: right drawer */}
          <motion.aside
            key="drawer-desktop"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 hidden h-full w-[420px] flex-col overflow-y-auto bg-white shadow-2xl md:flex"
          >
            {/* Header with nav */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={prev}
                  disabled={!canPrev}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  title="Previous (←)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  disabled={!canNext}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  title="Next (→)"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <DrawerContent
              image={image}
              categorySlug={categorySlug}
              detailHref={detailHref}
              isColoring={isColoring}
              isOwner={isOwner}
              onClose={close}
            />
          </motion.aside>

          {/* Mobile: bottom sheet */}
          <motion.div
            key="drawer-mobile"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl md:hidden"
          >
            {/* Drag handle + mobile nav */}
            <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={prev}
                  disabled={!canPrev}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  disabled={!canNext}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="h-1 w-10 rounded-full bg-gray-300" />
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
              <DrawerContent
                image={image}
                categorySlug={categorySlug}
                detailHref={detailHref}
                isColoring={isColoring}
                isOwner={isOwner}
                onClose={close}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface DrawerContentProps {
  image: { id: string; slug: string; title: string; url: string; transparent_url?: string; category: string; style: string; content_type?: string; aspect_ratio?: string; videoUrl?: string; prompt?: string; model?: string; has_transparency?: boolean; duration?: number };
  categorySlug: string;
  detailHref: string;
  isColoring: boolean;
  isOwner: boolean;
  onClose: () => void;
}

function formatModelLabel(model: string): string {
  const known: Record<string, string> = {
    "gemini": "Gemini 2.0 Flash",
    "gpt-image-1": "GPT Image 1",
    "gpt-image-1.5": "GPT Image 1.5",
    "gpt-image-2": "GPT Image 2",
    "kling-2.5-turbo": "Kling 2.5 Turbo",
    "kling-3.0-standard": "Kling 3.0 Standard",
    "kling-3.0-pro": "Kling 3.0 Pro",
  };
  return known[model] ?? model.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

import { MagnifyIcon, ImageLightbox } from "@/components/ImageLightbox";

// Optimistic progress bar: animates to ~85% over `duration`ms, snaps to 100% on complete.
function ProgressBar({
  active,
  complete,
  duration = 4000,
  colorClass = "bg-indigo-500",
}: {
  active: boolean;
  complete: boolean;
  duration?: number;
  colorClass?: string;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (complete) { setWidth(100); return; }
    if (active) {
      const t = setTimeout(() => setWidth(85), 30);
      return () => clearTimeout(t);
    }
    setWidth(0);
  }, [active, complete]);

  if (!active && !complete) return null;

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full ${colorClass} rounded-full`}
        style={{
          width: `${width}%`,
          transition: complete
            ? "width 200ms ease-out"
            : `width ${duration}ms cubic-bezier(0.05, 0.6, 0.4, 1)`,
        }}
      />
    </div>
  );
}

type RetouchState = "idle" | "open" | "loading" | "result" | "error";

interface RetouchResult {
  imageUrl: string;
  generation: {
    id: string;
    image_url: string;
    prompt: string;
    style: string;
    category: string;
    slug: string;
    aspect_ratio: string;
    model: string;
    created_at: string;
  } | null;
}

function DrawerContent({ image, categorySlug, detailHref, isColoring, isOwner, onClose }: DrawerContentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [retouchState, setRetouchState] = useState<RetouchState>("idle");
  const [retouchInstruction, setRetouchInstruction] = useState("");
  const [retouchResult, setRetouchResult] = useState<RetouchResult | null>(null);
  const [retouchError, setRetouchError] = useState<string | null>(null);

  // Local state for on-demand background removal
  type BgRemoveState = "idle" | "loading" | "done" | "error";
  const [bgRemoveState, setBgRemoveState] = useState<BgRemoveState>("idle");
  const [bgRemoveError, setBgRemoveError] = useState<string | null>(null);
  const [localHasTransparency, setLocalHasTransparency] = useState(!!image.has_transparency);
  // Prefer the stored transparent version when available
  const [displayUrl, setDisplayUrl] = useState(image.transparent_url ?? image.url);

  const openDrawer = useImageDrawer((s) => s.open);

  const isAnimation = !!image.videoUrl;
  const isIllustration = image.content_type === "illustration";
  // Treat anything that isn't animation, coloring, or illustration as clipart —
  // older images have content_type = null, so checking === "clipart" would hide the button for them.
  const isClipartWithoutTransparency =
    !isAnimation && !isColoring && !isIllustration && !localHasTransparency;

  async function handleRemoveBackground() {
    if (!image.id) return;
    setBgRemoveState("loading");
    setBgRemoveError(null);
    try {
      const res = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: image.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Background removal failed");
      setLocalHasTransparency(true);
      // transparentUrl is a new R2 key — no cache-buster needed
      setDisplayUrl(data.transparentUrl);
      setBgRemoveState("done");
    } catch (err) {
      setBgRemoveError((err as Error).message || "Failed. Please try again.");
      setBgRemoveState("error");
    }
  }

  async function handleRetouch() {
    if (!retouchInstruction.trim()) return;
    setRetouchState("loading");
    setRetouchError(null);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: image.url,
          instruction: retouchInstruction,
          isPublic: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retouch failed");
      setRetouchResult({ imageUrl: data.imageUrl, generation: data.generation || null });
      setRetouchState("result");
    } catch (err) {
      setRetouchError((err as Error).message || "Retouch failed. Please try again.");
      setRetouchState("error");
    }
  }

  function handleUseThis() {
    if (!retouchResult?.generation) return;
    const gen = retouchResult.generation;
    openDrawer(
      {
        id: gen.id,
        slug: gen.slug || gen.id,
        title: gen.prompt,
        url: gen.image_url,
        category: gen.category || "free",
        style: gen.style || "flat",
        aspect_ratio: gen.aspect_ratio || undefined,
        prompt: gen.prompt,
        model: gen.model || undefined,
      },
      [],
      true,
    );
    setRetouchState("idle");
    setRetouchInstruction("");
    setRetouchResult(null);
  }

  function handleRetouchCancel() {
    setRetouchState("idle");
    setRetouchInstruction("");
    setRetouchResult(null);
    setRetouchError(null);
  }

  const promptText = image.prompt || image.title;
  const rawTitle = image.prompt ? image.title : null;
  const displayTitle =
    rawTitle && rawTitle !== image.prompt && rawTitle.length <= 80
      ? rawTitle
      : null;

  const categoryHref = isColoring
    ? `/coloring-pages/${image.category}`
    : `/${categorySlug}`;
  const categoryLabel = isColoring ? image.category : categorySlug;
  const createHref = isColoring ? "/create/coloring-pages" : "/create";

  return (
    <>
      <div className="space-y-5 px-6 pb-8 pt-4">
        {/* Preview: video for animations, image otherwise */}
        <button
          type="button"
          onClick={() => retouchState !== "loading" && setLightboxOpen(true)}
          className="group relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 transition-all hover:border-gray-200 hover:shadow-md"
        >
          <div
            className={`relative w-full transition-opacity duration-300 ${retouchState === "loading" ? "opacity-40" : "opacity-100"}`}
            style={{ aspectRatio: image.aspect_ratio ? image.aspect_ratio.replace(":", "/") : "1/1" }}
          >
            {isAnimation ? (
              <video
                src={image.videoUrl}
                poster={image.url}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <Image
                src={displayUrl}
                alt={image.title}
                fill
                className="object-contain p-4"
                sizes="420px"
                unoptimized
              />
            )}
          </div>
          {retouchState === "loading" ? (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 rounded-b-2xl bg-gradient-to-t from-white/90 to-transparent px-4 pb-3 pt-6">
              <span className="text-xs font-semibold text-gray-500">Retouching…</span>
              <ProgressBar active colorClass="bg-pink-500" duration={8000} complete={false} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
              <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100">
                <MagnifyIcon className="h-3.5 w-3.5" />
                View larger
              </span>
            </div>
          )}
        </button>

        {/* Title */}
        {displayTitle && (
          <h3 className="text-lg font-bold leading-snug text-gray-900">
            {displayTitle}
          </h3>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={categoryHref}
            onClick={onClose}
            className="inline-flex items-center rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white"
          >
            {categoryLabel}
          </Link>
          {image.style && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              {image.style}
            </span>
          )}
          {isAnimation && (
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z" /></svg>
              Animation
            </span>
          )}
          {image.model && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              {formatModelLabel(image.model)}
            </span>
          )}
          {localHasTransparency && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Transparent PNG
            </span>
          )}
          {image.duration && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              {image.duration}s
            </span>
          )}
        </div>

        {/* AI Prompt */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              AI Image Prompt
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(promptText);
                setCopiedPrompt(true);
                setTimeout(() => setCopiedPrompt(false), 2000);
              }}
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                copiedPrompt
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              {copiedPrompt ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="break-all text-sm leading-relaxed text-gray-600">
            &ldquo;{promptText}&rdquo;
          </p>
        </div>

        {/* Primary action: Download */}
        {isAnimation ? (
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = `/api/download?url=${encodeURIComponent(image.videoUrl!)}`;
              a.download = `${image.slug}-animation.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="btn-primary flex w-full items-center justify-center py-3.5 text-sm"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Animation
          </button>
        ) : null}

        {/* Share — available for all asset types */}
        <div className="relative">
          <button
            onClick={() => setSharePopoverOpen(!sharePopoverOpen)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          {sharePopoverOpen && (
            <SharePopover
              url={detailHref}
              title={image.title}
              onClose={() => setSharePopoverOpen(false)}
            />
          )}
        </div>

        {isAnimation && isOwner && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Upload to YouTube
          </button>
        )}

        {!isAnimation ? (
          <button
            onClick={() =>
              isColoring
                ? downloadClip(displayUrl, `${image.slug}.pdf`, { pdf: true, title: image.title })
                : downloadClip(displayUrl, `${image.slug}.png`)
            }
            className="btn-primary w-full py-3.5 text-sm"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isColoring ? "Download Free PDF" : "Download Free PNG"}
          </button>
        ) : null}

        {/* Remove Background — only for clipart the user owns that isn't already transparent */}
        {isOwner && isClipartWithoutTransparency && bgRemoveState !== "done" && (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleRemoveBackground}
              disabled={bgRemoveState === "loading"}
              className={`relative flex w-full flex-col overflow-hidden rounded-xl border transition-colors disabled:cursor-not-allowed ${
                bgRemoveState === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
              }`}
            >
              <span className="flex items-center justify-center gap-2 py-3 text-sm font-semibold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                {bgRemoveState === "error" ? "Retry Remove Background" : bgRemoveState === "loading" ? "Removing background…" : "Remove Background"}
              </span>
              {bgRemoveState === "loading" && (
                <div className="px-3 pb-2.5">
                  <ProgressBar active complete={false} duration={4000} colorClass="bg-indigo-500" />
                </div>
              )}
            </button>
            {bgRemoveError && (
              <p className="text-center text-[11px] text-rose-500">{bgRemoveError}</p>
            )}
          </div>
        )}

        {/* Secondary actions — hide Retouch/Animate for animation cards */}
        {!isAnimation && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRetouchState(retouchState === "idle" ? "open" : "idle")}
              className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border py-3 text-sm font-semibold transition-colors ${
                retouchState !== "idle"
                  ? "border-pink-200 bg-pink-50 text-pink-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Retouch
            </button>
            <Link
              href={`/animate?id=${image.id}`}
              onClick={onClose}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M18 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125" />
              </svg>
              Animate
            </Link>
          </div>
        )}

        {/* Inline Retouch panel */}
        <AnimatePresence>
          {!isAnimation && retouchState !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden rounded-xl border border-pink-100 bg-pink-50/50"
            >
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-pink-400">
                    Retouch with AI
                  </p>
                  <button
                    onClick={handleRetouchCancel}
                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-gray-400 hover:bg-white hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  autoFocus={retouchState === "open"}
                  value={retouchInstruction}
                  onChange={(e) => setRetouchInstruction(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRetouch(); }}
                  placeholder="Describe the retouch… 'change to watercolor', 'make it a winter scene', 'add sunglasses'"
                  disabled={retouchState === "loading"}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
                />

                {retouchState === "error" && (
                  <p className="mt-2 text-xs text-red-500">{retouchError}</p>
                )}

                {retouchState !== "result" && (
                  <button
                    onClick={handleRetouch}
                    disabled={!retouchInstruction.trim() || retouchState === "loading"}
                    className="mt-3 flex w-full flex-col overflow-hidden rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2 py-2.5">
                    {retouchState === "loading" ? (
                      <>Retouching…</>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                        Retouch — 1 credit
                      </>
                    )}
                    </span>
                    {retouchState === "loading" && (
                      <div className="px-3 pb-2">
                        <ProgressBar active complete={false} duration={8000} colorClass="bg-white/50" />
                      </div>
                    )}
                  </button>
                )}

                {retouchState === "result" && retouchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 space-y-3"
                  >
                    <div className="overflow-hidden rounded-xl border border-pink-200 bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={retouchResult.imageUrl}
                        alt="Retouched result"
                        className="w-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUseThis}
                        className="btn-primary flex-1 py-2.5 text-sm"
                      >
                        Use this
                      </button>
                      <button
                        onClick={() => { setRetouchState("open"); setRetouchResult(null); }}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        Try again
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Similar */}
        <Link
          href={createHref}
          onClick={onClose}
          className="btn-secondary flex w-full items-center justify-center py-3 text-sm"
        >
          Generate Similar with AI
        </Link>

        {/* View full page */}
        <Link
          href={detailHref}
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          View full page
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Link>

        {/* License / Attribution */}
        {isOwner ? (
          <p className="text-center text-xs text-gray-300">
            Free for personal and commercial use.
          </p>
        ) : (
          <AttributionSection
            url={`https://clip.art${detailHref}`}
            title={image.title}
          />
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox
            src={isAnimation ? image.videoUrl! : image.url}
            alt={image.title}
            isVideo={isAnimation}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadOpen && isAnimation && (
          <UploadModal
            animation={{
              id: image.id,
              title: image.title,
              prompt: image.title,
              category: image.category,
              videoUrl: image.videoUrl!,
              thumbnailUrl: image.url || undefined,
            }}
            onClose={() => setUploadOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
