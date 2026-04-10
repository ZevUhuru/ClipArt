"use client";

import { useState } from "react";
import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import type { DbCategory } from "@/lib/categories";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";

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

export function ColoringThemePage({ theme, galleryImages = [], relatedThemes = [] }: ColoringThemePageProps) {
  const suggestedPrompts = theme.suggested_prompts || [];
  const seoContent = theme.seo_content || [];
  const [bookLoading, setBookLoading] = useState(false);

  async function handleDownloadBook() {
    setBookLoading(true);
    try {
      const res = await fetch(`/api/coloring-book/${theme.slug}`);
      if (!res.ok) throw new Error("generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${theme.slug}-coloring-book.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Coloring book download failed:", e);
    } finally {
      setBookLoading(false);
    }
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

      {/* Coloring Book Download Banner */}
      {galleryImages.length >= 4 && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-pink-100 bg-pink-50/60 px-6 py-5 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <svg className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Free {theme.name} Coloring Book
                </p>
                <p className="text-sm text-gray-500">
                  {Math.min(galleryImages.length, 10)} pages · print-ready PDF · branded with name line
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadBook}
              disabled={bookLoading}
              className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bookLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Building PDF…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Free PDF
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Gallery Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {galleryImages.length > 0 ? (
          <ImageGrid variant="coloring">
            {galleryImages.map((img) => (
              <ImageCard
                key={img.slug}
                image={{
                  slug: img.slug,
                  title: img.title,
                  url: img.url,
                  category: img.category,
                  style: "coloring",
                  aspect_ratio: img.aspect_ratio || "3:4",
                }}
                variant="coloring"
                href={`/coloring-pages/${theme.slug}/${img.slug}`}
              />
            ))}
          </ImageGrid>
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
