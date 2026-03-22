"use client";

import Image from "next/image";
import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import type { SampleImage } from "@/data/sampleGallery";
import { getImagesByCategory } from "@/data/sampleGallery";
import {
  categoryMap,
  getCategorySlugForImage,
  type Category,
} from "@/data/categories";
import { downloadClip } from "@/utils/downloadClip";

interface ImageDetailPageProps {
  image: SampleImage;
  categorySlug: string;
}

export function ImageDetailPage({ image, categorySlug }: ImageDetailPageProps) {
  const category = categoryMap.get(categorySlug);
  const categoryName = category?.name || categorySlug;
  const relatedImages = getImagesByCategory(image.category)
    .filter((img) => img.slug !== image.slug)
    .slice(0, 6);

  function handleDownload() {
    downloadClip(image.url, `${image.slug}.png`);
  }

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-6xl px-4 py-4"
      >
        <ol className="flex items-center gap-1.5 text-sm text-gray-400">
          <li>
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link
              href={`/${categorySlug}`}
              className="hover:text-gray-600"
            >
              {categoryName} Clip Art
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="truncate text-gray-600">{image.title}</li>
        </ol>
      </nav>

      {/* Main Content: two-column on desktop */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Image */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
            <div className="relative aspect-square w-full">
              <Image
                src={image.url}
                alt={image.description}
                fill
                className="object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
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
                href={`/${categorySlug}`}
                className="inline-flex items-center rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white"
              >
                {categoryName}
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
                  {tag}
                </span>
              ))}
            </div>

            {/* Download CTA */}
            <button
              onClick={handleDownload}
              className="btn-primary mt-8 w-full py-4 text-base"
            >
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
              Download Free PNG
            </button>

            {/* Generate similar */}
            <Link
              href="/create"
              className="btn-secondary mt-3 w-full justify-center py-3.5 text-base"
            >
              Generate Similar with AI
            </Link>

            {/* License info */}
            <p className="mt-4 text-center text-xs text-gray-400">
              Free for personal and commercial use. No attribution required.
            </p>
          </div>
        </div>
      </section>

      {/* Related Images */}
      {relatedImages.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
              More {categoryName} clip art
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {relatedImages.map((img) => {
                const slug = getCategorySlugForImage(img);
                return (
                  <Link
                    key={img.slug}
                    href={`/${slug}/${img.slug}`}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <Image
                        src={img.url}
                        alt={`${img.title} - free ${categoryName.toLowerCase()} clip art`}
                        fill
                        className="object-contain p-3 transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
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
              Create your own {categoryName.toLowerCase()} clip art
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Describe what you want and our AI generates it in seconds. 5 free
              generations, no sign-up required.
            </p>
            <div className="mt-8">
              <Link
                href="/create"
                className="btn-primary px-8 text-base"
              >
                Start Generating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-400 hover:text-gray-600"
          >
            clip.art
          </Link>
          <Link
            href="/create"
            className="text-sm font-medium text-gray-400 hover:text-gray-600"
          >
            AI Generator
          </Link>
        </div>
      </footer>

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
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://clip.art",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: `${categoryName} Clip Art`,
                  item: `https://clip.art/${categorySlug}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: image.title,
                  item: `https://clip.art/${categorySlug}/${image.slug}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
