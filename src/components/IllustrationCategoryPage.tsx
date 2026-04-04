"use client";

import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import type { DbCategory } from "@/lib/categories";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";

export interface IllustrationGalleryImage {
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  aspect_ratio?: string;
}

interface IllustrationCategoryPageProps {
  category: DbCategory;
  galleryImages?: IllustrationGalleryImage[];
  relatedCategories?: DbCategory[];
}

export function IllustrationCategoryPage({
  category,
  galleryImages = [],
  relatedCategories = [],
}: IllustrationCategoryPageProps) {
  const suggestedPrompts = category.suggested_prompts || [];
  const seoContent = category.seo_content || [];

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-8 pt-10 text-center sm:pt-14">
        <nav className="mb-4 text-sm text-gray-400" aria-label="Breadcrumb">
          <Link href="/illustrations" className="hover:text-gray-600">
            Illustrations
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-600">{category.name}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          {category.h1 || `${category.name} Illustrations`}
        </h1>
        {category.intro && (
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500">
            {category.intro}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/create/illustrations" className="btn-primary text-sm">
            Create an Illustration
          </Link>
        </div>
      </section>

      {/* Suggested prompts */}
      {suggestedPrompts.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedPrompts.map((p) => (
              <Link
                key={p}
                href={`/create/illustrations`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              >
                {p}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <ImageGrid>
            {galleryImages.map((img) => (
              <ImageCard
                key={img.slug}
                image={{
                  slug: img.slug,
                  title: img.title,
                  url: img.url,
                  category: img.category,
                  aspect_ratio: img.aspect_ratio || "4:3",
                }}
                href={`/illustrations/${img.category}/${img.slug}`}
              />
            ))}
          </ImageGrid>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-sm text-gray-400">
              No illustrations in this category yet. Be the first to create one!
            </p>
            <Link
              href="/create/illustrations"
              className="mt-4 inline-block rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md"
            >
              Create an Illustration
            </Link>
          </div>
        </section>
      )}

      {/* Related categories */}
      {relatedCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Related categories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {relatedCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/illustrations/${cat.slug}`}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO content */}
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
    </div>
  );
}
