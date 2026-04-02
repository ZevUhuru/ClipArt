"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import { SearchBar } from "./SearchBar";
import { getCategoryImages, getCategorySlugForImage } from "@/data/categories";
import type { SampleImage } from "@/data/sampleGallery";
import type { DbCategory } from "@/lib/categories";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";

export interface GalleryImage {
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
}

interface CategoryPageProps {
  category: DbCategory;
  galleryImages?: GalleryImage[];
  relatedCategories?: DbCategory[];
}

export function CategoryPage({ category, galleryImages = [], relatedCategories = [] }: CategoryPageProps) {
  const sampleImages = getCategoryImages(category.slug);
  const [searchResults, setSearchResults] = useState<GalleryImage[] | null>(null);
  const [filteredSamples, setFilteredSamples] = useState<SampleImage[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const suggestedPrompts = category.suggested_prompts || [];
  const seoContent = category.seo_content || [];

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setFilteredSamples(null);
      return;
    }

    setIsSearching(true);
    try {
      const lower = query.toLowerCase();
      const filtered = sampleImages.filter(
        (img) =>
          img.title.toLowerCase().includes(lower) ||
          img.description.toLowerCase().includes(lower) ||
          img.tags.some((t) => t.toLowerCase().includes(lower)),
      );
      setFilteredSamples(filtered);

      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category.slug)}`
      );
      const data = await res.json();
      setSearchResults(
        (data.results || []).map((r: Record<string, string>) => ({
          slug: r.slug || r.id,
          title: r.title,
          url: r.url,
          description: r.description,
          category: r.category,
          tags: [],
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [category.slug, sampleImages]);

  const isFiltering = searchResults !== null || filteredSamples !== null;
  const displayImages = searchResults ?? galleryImages;
  const displaySamples = filteredSamples ?? sampleImages;

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {category.h1.split(" ").map((word, i) => {
            if (word.toLowerCase() === "clip" || word.toLowerCase() === "art") {
              return (
                <span key={i} className="gradient-text">
                  {word}{" "}
                </span>
              );
            }
            return word + " ";
          })}
        </h1>
        {category.intro && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
            {category.intro}
          </p>
        )}
        <div className="mt-6">
          <Link href="/create" className="btn-primary text-base">
            Generate Your Own
          </Link>
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto max-w-2xl px-4 pb-8">
        <SearchBar
          onSearch={handleSearch}
          placeholder={`Search ${category.name.toLowerCase()} clip art...`}
          isLoading={isSearching}
        />
      </section>

      {/* Gallery Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {isFiltering && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {displayImages.length + displaySamples.length} result{displayImages.length + displaySamples.length !== 1 ? "s" : ""} found
            </p>
            <button
              onClick={() => { setSearchResults(null); setFilteredSamples(null); }}
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Clear search
            </button>
          </div>
        )}
        <ImageGrid className="lg:grid-cols-6">
          {displayImages.map((img) => (
            <ImageCard
              key={img.slug}
              image={{
                slug: img.slug,
                title: img.title,
                url: img.url,
                category: img.category,
              }}
              href={`/${img.category}/${img.slug}`}
            />
          ))}
          {displaySamples.map((img) => {
            const catSlug = getCategorySlugForImage(img);
            return (
              <ImageCard
                key={img.url}
                image={{
                  slug: img.slug,
                  title: img.title,
                  url: img.url,
                  category: catSlug,
                }}
                href={`/${catSlug}/${img.slug}`}
              />
            );
          })}
        </ImageGrid>
        {displayImages.length === 0 && displaySamples.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">
              {isFiltering
                ? "No results found. Try a different search term."
                : `No clip art yet. Be the first to generate ${category.name.toLowerCase()} clip art!`}
            </p>
          </div>
        )}
      </section>

      {/* Generate CTA */}
      {suggestedPrompts.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <div className="rounded-3xl bg-brand-gradient p-[2px]">
            <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Create custom {category.name.toLowerCase()} clip art
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                Describe exactly what you want and our AI will generate it in
                seconds. Try one of these prompts:
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <Link
                    key={prompt}
                    href="/create"
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 sm:text-sm"
                  >
                    &ldquo;{prompt}&rdquo;
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/create" className="btn-primary px-8 text-base">
                  Start Generating — It&apos;s Free
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

      {/* Related Categories */}
      {relatedCategories.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
              Browse more clip art
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {relatedCategories.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${related.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
                >
                  {related.h1}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
