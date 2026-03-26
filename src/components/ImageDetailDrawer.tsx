"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useImageDrawer } from "@/stores/useImageDrawer";
import { internalToSlug } from "@/data/categories";
import { downloadClip } from "@/utils/downloadClip";

function getCategorySlug(category: string): string {
  return internalToSlug[category] || "free";
}

export function ImageDetailDrawer() {
  const image = useImageDrawer((s) => s.image);
  const close = useImageDrawer((s) => s.close);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    },
    [close],
  );

  useEffect(() => {
    if (!image) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [image, handleEscape]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100) close();
  };

  if (!image) return null;

  const isColoring = image.style === "coloring";
  const categorySlug = getCategorySlug(image.category);
  const detailHref = isColoring
    ? `/coloring-pages/${image.category}/${image.slug}`
    : `/${categorySlug}/${image.slug}`;

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
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="truncate text-sm font-semibold text-gray-900">
                Image Details
              </h2>
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
            {/* Drag handle */}
            <div className="flex shrink-0 items-center justify-center pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
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
  image: { id: string; slug: string; title: string; url: string; category: string; style: string; aspect_ratio?: string };
  categorySlug: string;
  detailHref: string;
  isColoring: boolean;
  onClose: () => void;
}

function DrawerContent({ image, categorySlug, detailHref, isColoring, onClose }: DrawerContentProps) {
  const categoryHref = isColoring
    ? `/coloring-pages/${image.category}`
    : `/${categorySlug}`;
  const categoryLabel = isColoring ? image.category : categorySlug;
  const createHref = isColoring ? "/create/coloring-pages" : "/create";

  return (
    <div className="space-y-5 px-6 pb-8 pt-4">
      {/* Image */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        <div className={`relative w-full ${image.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"}`}>
          <Image
            src={image.url}
            alt={image.title}
            fill
            className="object-contain p-4"
            sizes="420px"
            unoptimized
          />
        </div>
      </div>

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
      </div>

      {/* Download button */}
      <button
        onClick={() => downloadClip(image.url, `${image.slug}.png`)}
        className="btn-primary w-full py-3.5 text-sm"
      >
        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Free PNG
      </button>

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

      {/* License */}
      <p className="text-center text-xs text-gray-300">
        Free for personal and commercial use. No attribution required.
      </p>
    </div>
  );
}
