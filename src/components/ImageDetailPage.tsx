"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { CategoryNav } from "./CategoryNav";
import { MagnifyIcon, ImageLightbox } from "./ImageLightbox";
import type { SampleImage } from "@/data/sampleGallery";
import { getImagesByCategory } from "@/data/sampleGallery";
import {
  categoryMap,
  getCategorySlugForImage,
} from "@/data/categories";
import { downloadClip } from "@/utils/downloadClip";
import { buildImageJsonLd, buildDetailBreadcrumb } from "@/lib/seo-jsonld";
import { AttributionSection } from "@/components/AttributionSection";
import type { ContentType } from "@/lib/seo";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { IllustrationMosaicGrid } from "@/components/IllustrationMosaicGrid";

interface RelatedImage {
  title: string;
  slug: string;
  category: string;
  url: string;
  aspect_ratio?: string;
}

interface StyleRelatedImage {
  title: string;
  slug: string;
  category: string;
  url: string;
  aspect_ratio?: string;
}

type ContentVariant = "clipart" | "coloring" | "illustration";

interface ImageDetailPageProps {
  image: SampleImage & { created_at?: string };
  categorySlug: string;
  isColoringPage?: boolean;
  contentType?: ContentVariant;
  relatedImages?: RelatedImage[];
  styleRelatedImages?: StyleRelatedImage[];
  categorySeoContent?: string[];
  categoryName?: string;
  imageId?: string;
}

function humanizeTag(tag: string): string {
  return tag
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ImageDetailPage({
  image,
  categorySlug,
  isColoringPage = false,
  contentType: contentTypeProp,
  relatedImages: relatedFromServer,
  styleRelatedImages,
  categorySeoContent,
  categoryName: categoryNameProp,
  imageId,
}: ImageDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // True when the image has a transparent version — either explicit flag or a transparent_url exists
  const hasTransparentVersion = !!(image.has_transparency || image.transparent_url);
  // Checkerboard is the standard preview for transparent assets.
  const [heroBg, setHeroBg] = useState<"transparent" | "white">("transparent");

  const variant: ContentVariant = contentTypeProp || (isColoringPage ? "coloring" : "clipart");
  const isIllustration = variant === "illustration";

  const category = categoryMap.get(categorySlug);
  const categoryName = categoryNameProp || category?.name || categorySlug;
  const safeCategorySlug = variant === "coloring" && categorySlug === "free" ? "" : categorySlug;
  const categoryHref = variant === "coloring"
    ? (safeCategorySlug ? `/coloring-pages/${safeCategorySlug}` : "/coloring-pages")
    : isIllustration
      ? `/illustrations/${categorySlug}`
      : `/${categorySlug}`;
  const categoryLabel = variant === "coloring"
    ? `${categoryName} Coloring Pages`
    : isIllustration
      ? `${categoryName} Illustrations`
      : `${categoryName} Clip Art`;
  const assetLabel = variant === "coloring"
    ? "Printable coloring page"
    : isIllustration
      ? "AI illustration"
      : "Transparent clip art";
  const createHref = variant === "coloring"
    ? "/create/coloring-pages"
    : isIllustration
      ? "/create/illustrations"
      : "/create";

  const relatedImages: RelatedImage[] = relatedFromServer && relatedFromServer.length > 0
    ? relatedFromServer
    : (isColoringPage
        ? []
        : getImagesByCategory(image.category)
            .filter((img) => img.slug !== image.slug)
            .slice(0, 8));

  const downloadUrl = image.transparent_url ?? image.url;

  function handleDownload() {
    if (isColoringPage) {
      downloadClip(image.url, `${image.slug}.pdf`, { pdf: true, title: image.title });
    } else {
      downloadClip(downloadUrl, `${image.slug}.png`);
    }
  }

  function handleDownloadWhiteBg() {
    downloadClip(image.url, `${image.slug}.png`);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f7f9]">
      <CategoryNav />

      <div className="relative overflow-x-hidden bg-gradient-to-b from-white via-[#f8f9fb] to-[#f6f7f9]">
        <div className="absolute inset-x-0 top-0 h-px bg-gray-200/80" />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="relative mx-auto w-full max-w-7xl px-4 pb-4 pt-5 sm:px-6 lg:px-8">
        <ol className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs font-semibold text-gray-400 sm:text-sm">
          <li className="shrink-0">
            <Link href="/" className="hover:text-gray-600">Home</Link>
          </li>
          <li aria-hidden="true" className="shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          {isColoringPage && (
            <>
              <li className="hidden shrink-0 sm:block">
                <Link href="/coloring-pages" className="hover:text-gray-600">Coloring Pages</Link>
              </li>
              <li aria-hidden="true" className="hidden shrink-0 sm:block">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
            </>
          )}
          <li className="min-w-0 shrink">
            <Link href={categoryHref} className="block truncate hover:text-gray-600">
              <span className="sm:hidden">{categoryName}</span>
              <span className="hidden sm:inline">{categoryLabel}</span>
            </Link>
          </li>
          <li aria-hidden="true" className="shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="min-w-0 flex-1 truncate text-gray-700">{image.title}</li>
        </ol>
      </nav>

      {/* Hero: two-column on desktop */}
      <article className="relative mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid min-w-0 items-start gap-6 min-[960px]:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] min-[1120px]:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] xl:gap-8">
          {/* Left: image frame */}
          <div className="mx-auto flex w-full min-w-0 max-w-[min(100%,320px)] flex-col items-center gap-3 sm:max-w-[380px] min-[960px]:sticky min-[960px]:top-24 min-[960px]:max-w-[320px] min-[960px]:self-start min-[1120px]:max-w-[360px] xl:max-w-[420px]">
            <div className="w-full max-w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-200/70">
              <div className={isIllustration ? "p-2" : "p-3"}>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className={`group relative block w-full max-w-full cursor-zoom-in overflow-hidden ${
                    isIllustration
                      ? "rounded-[1.5rem]"
                      : `rounded-[1.5rem] ${hasTransparentVersion && heroBg === "transparent" ? "bg-transparency-grid" : "bg-white"}`
                  }`}
                >
                  {/* Printable badge for coloring pages */}
                  {isColoringPage && (
                    <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                      Printable
                    </span>
                  )}

                  <div className={`relative w-full ${
                    image.aspect_ratio === "3:4" ? "aspect-[3/4]" :
                    image.aspect_ratio === "4:3" ? "aspect-[4/3]" :
                    "aspect-square"
                  }`}>
                    <Image
                      src={image.transparent_url ?? image.url}
                      alt={`${image.title} - Free ${categoryLabel}`}
                      fill
                      className={isIllustration ? "object-cover" : "object-contain"}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* Magnify overlay */}
                  <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100">
                    <MagnifyIcon className="h-3.5 w-3.5" />
                    Click to magnify
                  </span>
                </button>
              </div>
            </div>

            {/* Bg preview toggle — below the frame, outside the tap target */}
            {hasTransparentVersion && (
              <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-xl shadow-gray-200/70">
                <button
                  type="button"
                  onClick={() => setHeroBg("transparent")}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    heroBg === "transparent"
                      ? "bg-pink-50 text-pink-700 shadow-sm ring-1 ring-pink-100"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="block h-3 w-3 shrink-0 rounded-sm bg-transparency-grid-sm ring-1 ring-gray-200" />
                  Transparent Preview
                </button>
                <button
                  type="button"
                  onClick={() => setHeroBg("white")}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    heroBg === "white"
                      ? "bg-pink-50 text-pink-700 shadow-sm ring-1 ring-pink-100"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="block h-3 w-3 shrink-0 rounded-sm bg-white ring-1 ring-black/10" />
                  White Background
                </button>
              </div>
            )}
          </div>

          {/* Right: Details + Actions */}
          <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col justify-center min-[960px]:max-w-none">
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white p-5 shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/70 lg:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-pink-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-pink-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  {assetLabel}
                </span>
                <Link
                  href={categoryHref}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 transition-colors hover:border-pink-200 hover:text-pink-600"
                >
                  {categoryLabel}
                </Link>
              </div>

              <h1 className="mt-4 max-w-4xl text-[2rem] font-black leading-[1.05] tracking-tight text-gray-950 sm:text-4xl min-[960px]:text-[2.35rem] min-[1120px]:text-4xl xl:text-5xl">
                {image.title}
              </h1>

            {/* AI Image Prompt */}
            {image.prompt && image.prompt !== image.title && (
              <div className="mt-5 rounded-2xl border border-gray-200/70 bg-gray-50/80 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  AI Image Prompt
                </div>
                <p className="break-words text-sm italic leading-relaxed text-gray-600">
                  &ldquo;{image.prompt}&rdquo;
                </p>
              </div>
            )}

            {/* Description — only when it differs from the prompt */}
            {image.description && image.description !== image.prompt && (
              <p className="mt-5 text-base leading-relaxed text-gray-600">
                {image.description}
              </p>
            )}

            {/* Tags + feature badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {image.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}&content_type=${variant}`}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
                >
                  {humanizeTag(tag)}
                </Link>
              ))}
              {hasTransparentVersion && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transparent
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                    No Background
                  </span>
                </>
              )}
            </div>

            {/* Download CTA with shimmer */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                onClick={handleDownload}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-brand-gradient px-5 py-4 text-base font-black text-white shadow-xl shadow-pink-200/60 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-105"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {isColoringPage ? "Download Free PDF" : hasTransparentVersion ? "Download Transparent PNG" : "Download Free PNG"}
              </button>
              {hasTransparentVersion && (
                <button
                  type="button"
                  onClick={handleDownloadWhiteBg}
                  className="py-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                  or download with background
                </button>
              )}
            </div>

            {/* Edit + Animate */}
            <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <Link
                href={imageId ? `/edit?id=${imageId}` : "/edit"}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </Link>
              <Link
                href={imageId ? `/animate?id=${imageId}` : "/animate"}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M18 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125" />
                </svg>
                Animate
              </Link>
            </div>

            {/* Generate similar */}
            <Link
              href={createHref}
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-base font-black text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-600"
            >
              {isColoringPage
                ? "Create Similar Coloring Page"
                : isIllustration
                  ? "Create Similar Illustration"
                  : "Generate Similar with AI"}
            </Link>

            {/* Attribution */}
            <div className="mt-4">
              <AttributionSection
                url={`https://clip.art${variant === "coloring" ? `/coloring-pages/${safeCategorySlug}` : isIllustration ? `/illustrations/${categorySlug}` : `/${categorySlug}`}/${image.slug}`}
                title={image.title}
              />
            </div>

            {/* Trust strip */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-400">
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Free for commercial use
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Attribution appreciated
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                High-resolution PNG
              </span>
            </div>

            <p className="mt-3 text-center text-[10px] text-gray-400/70">
              Automated with{" "}
              <a
                href={`https://esy.com?utm_source=clipart&utm_medium=attribution_link&utm_campaign=${variant}_detail`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gray-500"
              >
                ESY
              </a>
            </p>
            </div>
          </div>
        </div>
      </article>
      </div>

      {/* Related Images */}
      {relatedImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm ring-1 ring-gray-200/70 sm:p-7">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                  Keep exploring
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                  {variant === "coloring"
                    ? `More ${categoryName} coloring pages`
                    : isIllustration
                      ? `More ${categoryName} illustrations`
                      : `More ${categoryName} clip art`}
                </h2>
              </div>
              <Link
                href={categoryHref}
                className="text-sm font-black text-gray-500 transition-colors hover:text-pink-600"
              >
                View all in category
              </Link>
            </div>
            {isIllustration ? (
              <IllustrationMosaicGrid
                items={relatedImages.map((img) => ({
                  slug: img.slug,
                  title: img.title,
                  url: img.url,
                  category: img.category,
                  aspect_ratio: img.aspect_ratio,
                }))}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            ) : (
              <ImageGrid variant={variant === "coloring" ? "coloring" : "clipart"}>
                {relatedImages.map((img) => {
                  const href = variant === "coloring"
                    ? `/coloring-pages/${img.category}/${img.slug}`
                    : `/${img.category}/${img.slug}`;
                  return (
                    <ImageCard
                      key={img.slug}
                      variant={variant === "coloring" ? "coloring" : "clipart"}
                      image={{
                        slug: img.slug,
                        title: img.title,
                        url: img.url,
                        category: img.category,
                        aspect_ratio: img.aspect_ratio,
                      }}
                      href={href}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  );
                })}
              </ImageGrid>
            )}
          </div>
        </section>
      )}

      {/* Category context */}
      {categorySeoContent && categorySeoContent.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 rounded-[2rem] border border-white bg-white p-6 shadow-sm ring-1 ring-gray-200/70 lg:grid-cols-[0.7fr_1.3fr] lg:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                Category guide
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-950">
                About {categoryName} {categoryLabel}
              </h2>
            </div>
            <div>
              <div className="space-y-3 text-sm leading-7 text-gray-600">
                {categorySeoContent.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <Link
                href={variant === "coloring" ? `/coloring-pages/${categorySlug}` : isIllustration ? `/illustrations/${categorySlug}` : `/${categorySlug}`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-black text-pink-600 transition-colors hover:text-pink-700"
              >
                Browse all {categoryName?.toLowerCase()} {categoryLabel.toLowerCase()}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* More in this style */}
      {styleRelatedImages && styleRelatedImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
              Visual match
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              More in this style
            </h2>
          </div>
          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm ring-1 ring-gray-200/70 sm:p-6">
            <ImageGrid variant={isIllustration ? "illustration" : variant === "coloring" ? "coloring" : "clipart"}>
              {styleRelatedImages.map((img) => (
                <ImageCard
                  key={img.slug}
                  variant={isIllustration ? "illustration" : variant === "coloring" ? "coloring" : "clipart"}
                  image={{
                    slug: img.slug,
                    title: img.title,
                    url: img.url,
                    category: img.category,
                    aspect_ratio: img.aspect_ratio,
                  }}
                  href={variant === "coloring" ? `/coloring-pages/${img.category}/${img.slug}` : isIllustration ? `/illustrations/${img.category}/${img.slug}` : `/${img.category}/${img.slug}`}
                  sizes="(max-width: 640px) 50vw, 170px"
                />
              ))}
            </ImageGrid>
          </div>
        </section>
      )}

      {/* Generate CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#171720] p-8 text-center shadow-2xl shadow-gray-200/80 sm:p-10">
          <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-pink-500/25 blur-3xl" />
          <div className="absolute -bottom-20 -right-12 h-48 w-48 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isColoringPage
                ? `Create your own ${categoryName.toLowerCase()} coloring pages`
                : isIllustration
                  ? `Create your own ${categoryName.toLowerCase()} illustrations`
                  : `Create your own ${categoryName.toLowerCase()} clip art`}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/60 sm:text-base">
              {isColoringPage
                ? "Describe any scene and our AI generates a printable coloring page with bold outlines. 10 free credits when you sign up."
                : isIllustration
                  ? "Describe any scene and our AI creates a beautiful illustration in seconds. 10 free credits when you sign up."
                  : "Describe what you want and our AI generates it in seconds. 10 free credits when you sign up."}
            </p>
            <div className="mt-8">
              <Link href={createHref} className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-base font-black text-gray-950 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-gray-100">
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox
            src={image.transparent_url ?? image.url}
            alt={image.title}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildImageJsonLd({
              title: image.title,
              description: image.description,
              imageUrl: image.url,
              tags: image.tags,
              datePublished: image.created_at,
              width: 1024,
              height: 1024,
            }),
            buildDetailBreadcrumb({
              contentType: variant as ContentType,
              categorySlug,
              categoryName,
              imageTitle: image.title,
              imageSlug: image.slug,
            }),
          ]),
        }}
      />
    </div>
  );
}
