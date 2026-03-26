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

interface RelatedImage {
  title: string;
  slug: string;
  category: string;
  url: string;
  aspect_ratio?: string;
}

interface ImageDetailPageProps {
  image: SampleImage;
  categorySlug: string;
  isColoringPage?: boolean;
  relatedImages?: RelatedImage[];
  categoryName?: string;
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
  relatedImages: relatedFromServer,
  categoryName: categoryNameProp,
}: ImageDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const category = categoryMap.get(categorySlug);
  const categoryName = categoryNameProp || category?.name || categorySlug;
  const categoryHref = isColoringPage ? `/coloring-pages/${categorySlug}` : `/${categorySlug}`;
  const categoryLabel = isColoringPage ? `${categoryName} Coloring Pages` : `${categoryName} Clip Art`;
  const createHref = isColoringPage ? "/create/coloring-pages" : "/create";

  const relatedImages: RelatedImage[] = relatedFromServer && relatedFromServer.length > 0
    ? relatedFromServer
    : (isColoringPage
        ? []
        : getImagesByCategory(image.category)
            .filter((img) => img.slug !== image.slug)
            .slice(0, 8));

  function handleDownload() {
    downloadClip(image.url, `${image.slug}.png`);
  }

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 py-4">
        <ol className="flex items-center gap-1.5 text-sm text-gray-400">
          <li>
            <Link href="/" className="hover:text-gray-600">Home</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          {isColoringPage && (
            <>
              <li>
                <Link href="/coloring-pages" className="hover:text-gray-600">Coloring Pages</Link>
              </li>
              <li aria-hidden="true">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
            </>
          )}
          <li>
            <Link href={categoryHref} className="hover:text-gray-600">{categoryLabel}</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="truncate text-gray-600">{image.title}</li>
        </ol>
      </nav>

      {/* Hero: two-column on desktop */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Gradient-framed image */}
          <div className="rounded-3xl bg-brand-gradient p-[2px]">
            <div className="relative overflow-hidden rounded-[22px] bg-white">
              {/* Printable badge for coloring pages */}
              {isColoringPage && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                  Printable
                </span>
              )}

              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative w-full cursor-zoom-in"
              >
                <div className={`relative w-full ${image.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"}`}>
                  <Image
                    src={image.url}
                    alt={image.description}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>

                {/* Magnify overlay */}
                <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100">
                  <MagnifyIcon className="h-3.5 w-3.5" />
                  Click to magnify
                </span>
              </button>
            </div>
          </div>

          {/* Right: Details + Actions */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              {image.title}
            </h1>

            {/* Category badge */}
            <div className="mt-4">
              <Link
                href={categoryHref}
                className="inline-flex items-center rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white"
              >
                {categoryLabel}
              </Link>
            </div>

            {/* Description */}
            <p className="mt-5 text-base leading-relaxed text-gray-600">
              {image.description}
            </p>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {image.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500"
                >
                  {humanizeTag(tag)}
                </span>
              ))}
            </div>

            {/* Download CTA with shimmer */}
            <button
              onClick={handleDownload}
              className="btn-primary group relative mt-8 w-full overflow-hidden py-4 text-base"
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
              {isColoringPage ? "Download Free Coloring Page" : "Download Free PNG"}
            </button>

            {/* Generate similar */}
            <Link
              href={createHref}
              className="btn-secondary mt-3 w-full justify-center py-3.5 text-base"
            >
              {isColoringPage ? "Create Similar Coloring Page" : "Generate Similar with AI"}
            </Link>

            {/* Trust strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
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
                No attribution required
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                High-resolution PNG
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Related Images */}
      {relatedImages.length > 0 && (
        <section className="bg-gray-50/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-8 text-xl font-bold text-gray-900 sm:text-2xl">
              {isColoringPage
                ? `More ${categoryName} coloring pages`
                : `More ${categoryName} clip art`}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {relatedImages.map((img) => {
                const href = isColoringPage
                  ? `/coloring-pages/${img.category}/${img.slug}`
                  : `/${getCategorySlugForImage(img as SampleImage)}/${img.slug}`;
                return (
                  <Link
                    key={img.slug}
                    href={href}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className={`relative bg-gray-50 ${img.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"}`}>
                      <Image
                        src={img.url}
                        alt={img.title}
                        fill
                        className="object-contain p-3 transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-xs font-medium text-gray-600">
                        {img.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Generate CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {isColoringPage
                ? `Create your own ${categoryName.toLowerCase()} coloring pages`
                : `Create your own ${categoryName.toLowerCase()} clip art`}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              {isColoringPage
                ? "Describe any scene and our AI generates a printable coloring page with bold outlines. 10 free credits when you sign up."
                : "Describe what you want and our AI generates it in seconds. 10 free credits when you sign up."}
            </p>
            <div className="mt-8">
              <Link href={createHref} className="btn-primary px-8 text-base">
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
            src={image.url}
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
            {
              "@context": "https://schema.org",
              "@type": "ImageObject",
              name: image.title,
              description: image.description,
              contentUrl: image.url,
              thumbnailUrl: image.url,
              author: {
                "@type": "Organization",
                name: "clip.art",
                url: "https://clip.art",
              },
              copyrightHolder: {
                "@type": "Organization",
                name: "clip.art",
              },
              license: "https://clip.art/free",
              acquireLicensePage: "https://clip.art/free",
              keywords: image.tags.join(", "),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: isColoringPage
                ? [
                    { "@type": "ListItem", position: 1, name: "Home", item: "https://clip.art" },
                    { "@type": "ListItem", position: 2, name: "Coloring Pages", item: "https://clip.art/coloring-pages" },
                    { "@type": "ListItem", position: 3, name: categoryLabel, item: `https://clip.art/coloring-pages/${categorySlug}` },
                    { "@type": "ListItem", position: 4, name: image.title, item: `https://clip.art/coloring-pages/${categorySlug}/${image.slug}` },
                  ]
                : [
                    { "@type": "ListItem", position: 1, name: "Home", item: "https://clip.art" },
                    { "@type": "ListItem", position: 2, name: `${categoryName} Clip Art`, item: `https://clip.art/${categorySlug}` },
                    { "@type": "ListItem", position: 3, name: image.title, item: `https://clip.art/${categorySlug}/${image.slug}` },
                  ],
            },
          ]),
        }}
      />
    </div>
  );
}
