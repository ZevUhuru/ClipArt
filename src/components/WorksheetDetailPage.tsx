"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { CategoryNav } from "./CategoryNav";
import { MagnifyIcon, ImageLightbox } from "./ImageLightbox";
import { downloadClip } from "@/utils/downloadClip";
import { AttributionSection } from "@/components/AttributionSection";

interface WorksheetDetailImage {
  title: string;
  slug: string;
  url: string;
  description?: string;
  prompt?: string;
  tags: string[];
  aspect_ratio?: string;
  grade: string;
  subject: string;
  topic: string;
  created_at?: string;
}

interface WorksheetRelated {
  title: string;
  slug: string;
  grade: string;
  subject: string;
  topic: string;
  url: string;
  aspect_ratio?: string;
}

interface WorksheetDetailPageProps {
  image: WorksheetDetailImage;
  gradeLabel: string;
  subjectLabel: string;
  topicLabel: string;
  relatedImages?: WorksheetRelated[];
  topicSeoContent?: string[];
  jsonLd: object;
  imageId?: string;
}

function humanizeTag(tag: string): string {
  return tag
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function WorksheetDetailPage({
  image,
  gradeLabel,
  subjectLabel,
  topicLabel,
  relatedImages = [],
  topicSeoContent,
  jsonLd,
  imageId,
}: WorksheetDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const gradeHref = `/worksheets/${image.grade}`;
  const subjectHref = `/worksheets/${image.grade}/${image.subject}`;
  const topicHref = `/worksheets/${image.grade}/${image.subject}/${image.topic}`;
  const createHref = "/create/worksheets";

  function handleDownload() {
    downloadClip(image.url, `${image.slug}.pdf`, {
      pdf: true,
      title: image.title,
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 py-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-400">
          <li>
            <Link href="/" className="hover:text-gray-600">Home</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href="/worksheets" className="hover:text-gray-600">Worksheets</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={gradeHref} className="hover:text-gray-600">{gradeLabel}</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={subjectHref} className="hover:text-gray-600">{subjectLabel}</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={topicHref} className="hover:text-gray-600">{topicLabel}</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="truncate text-gray-600">{image.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <article className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="overflow-hidden rounded-2xl bg-[#1c1c27]">
            <div className="p-3">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative w-full cursor-zoom-in overflow-hidden rounded-xl"
              >
                <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                  Printable
                </span>

                <div className={`relative w-full ${image.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"}`}>
                  <Image
                    src={image.url}
                    alt={`${image.title} - Free ${gradeLabel} ${subjectLabel} worksheet`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                </div>

                <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                  <MagnifyIcon className="h-3.5 w-3.5" />
                  Click to magnify
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              {image.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={gradeHref}
                className="inline-flex items-center rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white"
              >
                {gradeLabel}
              </Link>
              <Link
                href={subjectHref}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-700"
              >
                {subjectLabel}
              </Link>
              <Link
                href={topicHref}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-700"
              >
                {topicLabel}
              </Link>
            </div>

            {image.description && image.description !== image.prompt && (
              <p className="mt-5 text-base leading-relaxed text-gray-600">
                {image.description}
              </p>
            )}

            {image.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}&content_type=worksheet`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
                  >
                    {humanizeTag(tag)}
                  </Link>
                ))}
              </div>
            )}

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
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Free PDF
            </button>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href={imageId ? `/edit?id=${imageId}` : "/edit"}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              >
                Edit
              </Link>
              <Link
                href={createHref}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              >
                Create Similar
              </Link>
            </div>

            <div className="mt-4">
              <AttributionSection
                url={`https://clip.art/worksheets/${image.grade}/${image.subject}/${image.topic}/${image.slug}`}
                title={image.title}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Free for classroom use
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Printable PDF
              </span>
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {gradeLabel} aligned
              </span>
            </div>

            <p className="mt-3 text-center text-[10px] text-gray-400/70">
              Automated with{" "}
              <a
                href="https://esy.com?utm_source=clipart&utm_medium=attribution_link&utm_campaign=worksheet_detail"
                target="_blank"
                rel="noopener"
                className="transition-colors hover:text-gray-500"
              >
                ESY
              </a>
            </p>
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-6xl px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Related Worksheets */}
      {relatedImages.length > 0 && (
        <section className="bg-gray-50/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-8 text-xl font-bold text-gray-900 sm:text-2xl">
              More {topicLabel.toLowerCase()} worksheets
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {relatedImages.map((img) => {
                const href = `/worksheets/${img.grade}/${img.subject}/${img.topic}/${img.slug}`;
                const aspectClass = img.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square";
                return (
                  <Link
                    key={img.slug}
                    href={href}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className={`relative bg-gray-50 ${aspectClass}`}>
                      <Image
                        src={img.url}
                        alt={`${img.title} — free ${gradeLabel} worksheet`}
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

      {/* Topic context */}
      {topicSeoContent && topicSeoContent.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            About {topicLabel} worksheets for {gradeLabel}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            {topicSeoContent.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <Link
            href={topicHref}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-pink-600 transition-colors hover:text-pink-700"
          >
            Browse all {topicLabel.toLowerCase()} worksheets
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>
      )}

      {/* Generate CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own {topicLabel.toLowerCase()} worksheets
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Pick a grade, subject and topic, describe the activity, and our
              AI generates a printable worksheet with cute illustrations.
            </p>
            <div className="mt-8">
              <Link href={createHref} className="btn-primary px-8 text-base">
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox
            src={image.url}
            alt={image.title}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
