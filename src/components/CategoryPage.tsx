"use client";

import Image from "next/image";
import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import {
  type Category,
  categoryMap,
  getCategoryImages,
  getCategorySlugForImage,
} from "@/data/categories";
import type { SampleImage } from "@/data/sampleGallery";

interface CategoryPageProps {
  category: Category;
}

function ImageCard({ image }: { image: SampleImage }) {
  const slug = getCategorySlugForImage(image);
  return (
    <Link
      href={`/${slug}/${image.slug}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={image.url}
          alt={image.title}
          fill
          className="object-contain p-3 transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
        />
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-xs font-medium text-gray-600">
          {image.title}
        </p>
      </div>
    </Link>
  );
}

function PlaceholderCard({ index, categoryName }: { index: number; categoryName: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all hover:border-pink-300 hover:bg-pink-50/30">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-400">Coming soon</p>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-xs font-medium text-gray-400">
          {categoryName} #{index + 1}
        </p>
      </div>
    </div>
  );
}

export function CategoryPage({ category }: CategoryPageProps) {
  const existingImages = getCategoryImages(category.slug);

  const totalSlots = 12;
  const placeholderCount = Math.max(0, totalSlots - existingImages.length);

  const relatedCategories = category.relatedSlugs
    .map((slug) => categoryMap.get(slug))
    .filter(Boolean) as Category[];

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
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          {category.intro}
        </p>
        <div className="mt-6">
          <Link href="/generator" className="btn-primary text-base">
            Generate Your Own
          </Link>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {existingImages.map((img) => (
            <ImageCard key={img.url} image={img} />
          ))}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <PlaceholderCard
              key={`placeholder-${i}`}
              index={existingImages.length + i}
              categoryName={category.name}
            />
          ))}
        </div>
      </section>

      {/* Generate CTA */}
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
              {category.suggestedPrompts.map((prompt) => (
                <Link
                  key={prompt}
                  href="/generator"
                  className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 sm:text-sm"
                >
                  &ldquo;{prompt}&rdquo;
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/generator" className="btn-primary px-8 text-base">
                Start Generating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        {category.seoContent.map((paragraph, i) => (
          <p
            key={i}
            className="mt-4 text-sm leading-relaxed text-gray-600 first:mt-0 sm:text-base"
          >
            {paragraph}
          </p>
        ))}
      </section>

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

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-600">
            clip.art
          </Link>
          <Link
            href="/generator"
            className="text-sm font-medium text-gray-400 hover:text-gray-600"
          >
            AI Generator
          </Link>
        </div>
      </footer>
    </div>
  );
}
