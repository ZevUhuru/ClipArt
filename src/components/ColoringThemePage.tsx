"use client";

import Image from "next/image";
import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import type { DbCategory } from "@/lib/categories";
import { downloadClip } from "@/utils/downloadClip";

export interface ColoringGalleryImage {
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  aspect_ratio?: string;
}

interface ColoringThemePageProps {
  theme: DbCategory;
  galleryImages?: ColoringGalleryImage[];
  relatedThemes?: DbCategory[];
}

function GalleryImageCard({ image, theme }: { image: ColoringGalleryImage; theme: string }) {
  return (
    <Link
      href={`/coloring-pages/${theme}/${image.slug}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] bg-gray-50">
        <Image
          src={image.url}
          alt={`${image.title} — free ${theme} coloring page`}
          fill
          className="object-contain p-3 transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          unoptimized
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="truncate text-xs font-medium text-gray-600">
          {image.title}
        </p>
        <button
          onClick={(e) => { e.preventDefault(); downloadClip(image.url, `${image.slug}.png`); }}
          className="ml-2 flex-shrink-0 text-pink-500 hover:text-pink-700"
          title="Download"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </Link>
  );
}

export function ColoringThemePage({ theme, galleryImages = [], relatedThemes = [] }: ColoringThemePageProps) {
  const suggestedPrompts = theme.suggested_prompts || [];
  const seoContent = theme.seo_content || [];

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
          <li>
            <Link href="/coloring-pages" className="hover:text-gray-600">Coloring Pages</Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="text-gray-600">{theme.name}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-4 text-center sm:pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {theme.h1.split(" ").map((word, i) => {
            if (word.toLowerCase() === "coloring" || word.toLowerCase() === "pages") {
              return (
                <span key={i} className="gradient-text">
                  {word}{" "}
                </span>
              );
            }
            return word + " ";
          })}
        </h1>
        {theme.intro && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
            {theme.intro}
          </p>
        )}
        <div className="mt-6">
          <Link href="/create/coloring-pages" className="btn-primary text-base">
            Create {theme.name} Coloring Pages
          </Link>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryImages.map((img) => (
              <GalleryImageCard key={img.slug} image={img} theme={theme.slug} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">
              No {theme.name.toLowerCase()} coloring pages yet. Be the first to create one!
            </p>
            <Link
              href="/create/coloring-pages"
              className="mt-4 inline-block rounded-full bg-brand-gradient px-6 py-2 text-sm font-bold text-white"
            >
              Create Now
            </Link>
          </div>
        )}
      </section>

      {/* Generate CTA */}
      {suggestedPrompts.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <div className="rounded-3xl bg-brand-gradient p-[2px]">
            <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Create custom {theme.name.toLowerCase()} coloring pages
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                Describe any {theme.name.toLowerCase()} scene and our AI will
                generate a printable coloring page with bold outlines. Try one
                of these:
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <Link
                    key={prompt}
                    href="/create/coloring-pages"
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 sm:text-sm"
                  >
                    &ldquo;{prompt}&rdquo;
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/create/coloring-pages" className="btn-primary px-8 text-base">
                  Start Creating — It&apos;s Free
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEO Content */}
      {seoContent.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          {seoContent.map((paragraph, i) => (
            <p
              key={i}
              className="mt-4 text-sm leading-relaxed text-gray-600 first:mt-0 sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </section>
      )}

      {/* Related Themes */}
      {relatedThemes.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
              More coloring pages
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {relatedThemes.map((related) => (
                <Link
                  key={related.slug}
                  href={`/coloring-pages/${related.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
                >
                  {related.h1}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-600">
            clip.art
          </Link>
          <Link href="/coloring-pages" className="text-sm font-medium text-gray-400 hover:text-gray-600">
            All Coloring Pages
          </Link>
        </div>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: theme.h1,
            description: theme.meta_description || theme.intro,
            url: `https://clip.art/coloring-pages/${theme.slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: "clip.art",
              url: "https://clip.art",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://clip.art" },
                { "@type": "ListItem", position: 2, name: "Coloring Pages", item: "https://clip.art/coloring-pages" },
                { "@type": "ListItem", position: 3, name: theme.name, item: `https://clip.art/coloring-pages/${theme.slug}` },
              ],
            },
          }),
        }}
      />
    </div>
  );
}
