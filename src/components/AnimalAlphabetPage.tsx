"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoryNav } from "./CategoryNav";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import type { AnimalEntry, GalleryRow } from "@/lib/animals";
import type { DbCategory } from "@/lib/categories";

interface AnimalAlphabetPageProps {
  category: DbCategory;
  letter: string;
  animals: AnimalEntry[];
  galleryImages: {
    slug: string;
    title: string;
    url: string;
    description: string;
    category: string;
    tags: string[];
    aspect_ratio?: string;
  }[];
  coloringImages: GalleryRow[];
  animations: {
    id: string;
    slug: string;
    title: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
  }[];
  relatedCategories: DbCategory[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function ConservationBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    "Least Concern": "bg-green-100 text-green-800",
    Domesticated: "bg-blue-100 text-blue-800",
    "Near Threatened": "bg-yellow-100 text-yellow-800",
    Vulnerable: "bg-orange-100 text-orange-800",
    Endangered: "bg-red-100 text-red-800",
    "Critically Endangered": "bg-red-200 text-red-900",
  };

  let cls = "bg-gray-100 text-gray-700";
  for (const [key, val] of Object.entries(colorMap)) {
    if (status.includes(key)) {
      cls = val;
      break;
    }
  }

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

function AnimalFactCard({ animal }: { animal: AnimalEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              {animal.name}
            </h3>
            {animal.scientific_name && (
              <p className="mt-0.5 text-xs italic text-gray-400">
                {animal.scientific_name}
              </p>
            )}
          </div>
          {animal.conservation_status && (
            <ConservationBadge status={animal.conservation_status} />
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          {animal.description}
        </p>

        {animal.fun_fact && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Fun Fact
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              {animal.fun_fact}
            </p>
          </div>
        )}

        {expanded && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {animal.habitat && (
              <div className="rounded-xl bg-green-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">Habitat</p>
                <p className="mt-1 text-xs text-green-900">{animal.habitat}</p>
              </div>
            )}
            {animal.diet && (
              <div className="rounded-xl bg-orange-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Diet</p>
                <p className="mt-1 text-xs text-orange-900">{animal.diet}</p>
              </div>
            )}
            {animal.size && (
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Size</p>
                <p className="mt-1 text-xs text-blue-900">{animal.size}</p>
              </div>
            )}
            {animal.lifespan && (
              <div className="rounded-xl bg-purple-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700">Lifespan</p>
                <p className="mt-1 text-xs text-purple-900">{animal.lifespan}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-medium text-pink-600 hover:text-pink-700"
        >
          {expanded ? "Show less" : "Show habitat, diet & more"}
        </button>
      </div>
    </div>
  );
}

export function AnimalAlphabetPage({
  category,
  letter,
  animals,
  galleryImages,
  coloringImages,
  animations,
  relatedCategories,
}: AnimalAlphabetPageProps) {
  const [visibleImages, setVisibleImages] = useState(30);
  const [loadingMore, setLoadingMore] = useState(false);
  const [extraImages, setExtraImages] = useState<typeof galleryImages>([]);

  const allImages = [...galleryImages, ...extraImages];
  const displayImages = allImages.slice(0, visibleImages);
  const hasMore = visibleImages < allImages.length || allImages.length >= 30;

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      if (visibleImages < allImages.length) {
        setVisibleImages((v) => v + 30);
      } else {
        const res = await fetch(
          `/api/search?category=${encodeURIComponent(category.slug)}&content_type=clipart&limit=30&offset=${allImages.length}&browse=1`,
        );
        const data = await res.json();
        const newImages = (data.results || []).map(
          (r: Record<string, string>) => ({
            slug: r.slug || r.id,
            title: r.title,
            url: r.url,
            description: r.description,
            category: r.category,
            tags: [r.style, r.category].filter(Boolean),
            aspect_ratio: r.aspect_ratio,
          }),
        );
        if (newImages.length > 0) {
          setExtraImages((prev) => [...prev, ...newImages]);
          setVisibleImages((v) => v + 30);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, visibleImages, allImages.length, category.slug]);

  const suggestedPrompts = category.suggested_prompts || [];
  const seoContent = category.seo_content || [];
  const animalNames = animals.map((a) => a.name);

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* A-Z Quick Nav */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-hide">
          {ALPHABET.map((l) => (
            <Link
              key={l}
              href={`/animals-that-start-with-${l.toLowerCase()}`}
              aria-label={`Animals that start with ${l}`}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                l === letter
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-pink-100 hover:text-pink-700"
              }`}
            >
              {l}
            </Link>
          ))}
          <Link
            href="/animals"
            className="ml-1 flex-shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200"
          >
            All Animals
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-8 pt-10 text-center sm:pt-14">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {category.h1.split(" ").map((word, i) => {
            if (
              word.toLowerCase() === "clip" ||
              word.toLowerCase() === "art"
            ) {
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
        <p className="mx-auto mt-2 text-sm text-gray-400">
          {animals.length} animals explored &middot;{" "}
          {allImages.length}+ free clip art images
        </p>
      </section>

      {/* Jump to sections */}
      {animals.length > 0 && (
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-1.5 px-4 pb-8">
          {animals.map((a) => (
            <a
              key={a.slug}
              href={`#${a.slug}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
            >
              {a.name}
            </a>
          ))}
        </div>
      )}

      {/* Main Clip Art Gallery */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">
          {letter}-Animal Clip Art Gallery
        </h2>
        {displayImages.length > 0 ? (
          <>
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
            </ImageGrid>
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Clip Art"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">
              No clip art yet for this letter. Be the first to generate some!
            </p>
            <Link href="/create" className="btn-primary mt-4 inline-block text-sm">
              Generate Clip Art
            </Link>
          </div>
        )}
      </section>

      {/* Animal Encyclopedia */}
      {animals.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/30">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Animals That Start With {letter}
            </h2>
            <p className="mb-8 text-center text-sm text-gray-500">
              Explore {animals.length} animals, fun facts, habitats, and more
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {animals.map((animal) => (
                <div key={animal.id} id={animal.slug}>
                  <AnimalFactCard animal={animal} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Coloring Pages Section */}
      {coloringImages.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {letter}-Animal Coloring Pages
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Free printable coloring pages featuring animals that start with{" "}
                {letter}
              </p>
            </div>
            <Link
              href="/coloring-pages"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              All coloring pages &rarr;
            </Link>
          </div>
          <ImageGrid variant="coloring">
            {coloringImages.map((img) => (
              <ImageCard
                key={img.id}
                variant="coloring"
                image={{
                  slug: img.slug || img.id,
                  title: img.title || img.prompt,
                  url: img.image_url,
                  category: img.category,
                }}
                href={`/coloring-pages/${img.category}/${img.slug || img.id}`}
              />
            ))}
          </ImageGrid>
        </section>
      )}

      {/* Animations Section */}
      {animations.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/30">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {letter}-Animal Animations
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Animated clip art featuring animals that start with {letter}
                </p>
              </div>
              <Link
                href="/animations"
                className="text-sm font-medium text-pink-600 hover:text-pink-700"
              >
                All animations &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {animations.map((anim) => (
                <Link
                  key={anim.id}
                  href={`/animations/${anim.slug}`}
                  className="group relative overflow-hidden rounded-xl bg-gray-100 transition-shadow hover:shadow-lg"
                >
                  <div className="aspect-square">
                    {anim.thumbnail_url && (
                      <Image
                        src={anim.thumbnail_url}
                        alt={anim.title || "Animal animation"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                        unoptimized
                      />
                    )}
                    <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      <svg
                        className="h-2 w-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                      Video
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Generate CTA */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own {letter}-animal clip art
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Describe exactly what you want and our AI will generate it in
              seconds. Try one of these prompts:
            </p>
            {suggestedPrompts.length > 0 && (
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
            )}
            <div className="mt-8">
              <Link href="/create" className="btn-primary px-8 text-base">
                Start Generating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      {seoContent.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-12">
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

      {/* Related Categories / Next/Prev Letters */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          {/* Prev / Next letter nav */}
          <div className="mb-8 flex items-center justify-center gap-4">
            {letter !== "A" && (
              <Link
                href={`/animals-that-start-with-${String.fromCharCode(letter.charCodeAt(0) - 1).toLowerCase()}`}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
              >
                &larr; Letter{" "}
                {String.fromCharCode(letter.charCodeAt(0) - 1)}
              </Link>
            )}
            <Link
              href="/animals"
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
            >
              All Animals A-Z
            </Link>
            {letter !== "Z" && (
              <Link
                href={`/animals-that-start-with-${String.fromCharCode(letter.charCodeAt(0) + 1).toLowerCase()}`}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
              >
                Letter{" "}
                {String.fromCharCode(letter.charCodeAt(0) + 1)} &rarr;
              </Link>
            )}
          </div>

          {/* Related clip art categories */}
          {relatedCategories.length > 0 && (
            <>
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
