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

  const contentType = (image as { content_type?: string }).content_type;
  const isColoring = contentType === "coloring" || image.style === "coloring";
  const isIllustration = contentType === "illustration";
  const categorySlug = getCategorySlug(image.category);
  const detailHref = isColoring
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

            <div className="flex-1 overflow-y-auto">
              <DrawerContent
                image={image}
                categorySlug={categorySlug}
                detailHref={detailHref}
                isColoring={isColoring}
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
  image: { id: string; slug: string; title: string; url: string; category: string; style: string; aspect_ratio?: string; videoUrl?: string };
  categorySlug: string;
  detailHref: string;
  isColoring: boolean;
  onClose: () => void;
}

import { MagnifyIcon, ImageLightbox } from "@/components/ImageLightbox";

function DrawerContent({ image, categorySlug, detailHref, isColoring, onClose }: DrawerContentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const isAnimation = !!image.videoUrl;

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
          onClick={() => setLightboxOpen(true)}
          className="group relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 transition-all hover:border-gray-200 hover:shadow-md"
        >
          <div className="relative w-full" style={{ aspectRatio: image.aspect_ratio ? image.aspect_ratio.replace(":", "/") : "1/1" }}>
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
                src={image.url}
                alt={image.title}
                fill
                className="object-contain p-4"
                sizes="420px"
                unoptimized
              />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100">
              <MagnifyIcon className="h-3.5 w-3.5" />
              View larger
            </span>
          </div>
        </button>

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug text-gray-900">
          {image.title}
        </h3>

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

        {isAnimation && (
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
        )}

        {isAnimation && (
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
            onClick={() => downloadClip(image.url, `${image.slug}.png`)}
            className="btn-primary w-full py-3.5 text-sm"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isColoring ? "Download Free Coloring Page" : "Download Free PNG"}
          </button>
        ) : null}

        {/* Secondary actions — hide Edit/Animate for animation cards */}
        {!isAnimation && (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/edit?id=${image.id}`}
              onClick={onClose}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </Link>
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

        {/* Generate Similar */}
        <Link
          href={createHref}
          onClick={onClose}
          className="btn-secondary flex w-full items-center justify-center py-3 text-sm"
        >
          Generate Similar with AI
        </Link>

        {/* View full page — only for non-animation items */}
        {!isAnimation && (
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
        )}

        {/* License */}
        <p className="text-center text-xs text-gray-300">
          Free for personal and commercial use. No attribution required.
        </p>
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
