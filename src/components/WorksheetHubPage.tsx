import Link from "next/link";
import type { DbCategory } from "@/lib/categories";
import { CategoryNav } from "./CategoryNav";
import { ImageCard } from "./ImageCard";
import { ImageGrid } from "./ImageGrid";

export interface WorksheetGalleryImage {
  slug: string;
  title: string;
  url: string;
  category: string;
  grade: string;
  subject: string;
  topic: string;
  aspect_ratio?: string;
}

interface Crumb {
  label: string;
  href?: string;
}

interface ChildTile {
  href: string;
  title: string;
  subtitle?: string;
}

interface WorksheetHubPageProps {
  category: DbCategory;
  breadcrumbs: Crumb[];
  childTilesLabel?: string;
  childTiles?: ChildTile[];
  galleryImages?: WorksheetGalleryImage[];
  ctaHref: string;
  ctaLabel: string;
  jsonLd: object;
}

export function WorksheetHubPage({
  category,
  breadcrumbs,
  childTilesLabel,
  childTiles = [],
  galleryImages = [],
  ctaHref,
  ctaLabel,
  jsonLd,
}: WorksheetHubPageProps) {
  const seoContent = category.seo_content || [];
  const suggestedPrompts = category.suggested_prompts || [];

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 py-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-400">
          {breadcrumbs.map((crumb, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-gray-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-600">{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-4 text-center sm:pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {category.h1}
        </h1>
        {category.intro && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
            {category.intro}
          </p>
        )}
        <div className="mt-6">
          <Link href={ctaHref} className="btn-primary text-base">
            {ctaLabel}
          </Link>
        </div>
      </section>

      {/* Child tiles (subjects, topics, etc.) */}
      {childTiles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          {childTilesLabel && (
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
              {childTilesLabel}
            </h2>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {childTiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                  {tile.title}
                </p>
                {tile.subtitle && (
                  <p className="mt-1 text-xs text-gray-400">{tile.subtitle}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {galleryImages.length > 0 ? (
          <ImageGrid variant="coloring">
            {galleryImages.map((img) => (
              <ImageCard
                key={`${img.grade}-${img.subject}-${img.topic}-${img.slug}`}
                image={{
                  slug: img.slug,
                  title: img.title,
                  url: img.url,
                  category: img.category,
                  style: "cartoon",
                  aspect_ratio: img.aspect_ratio || "3:4",
                }}
                variant="coloring"
                href={`/worksheets/${img.grade}/${img.subject}/${img.topic}/${img.slug}`}
              />
            ))}
          </ImageGrid>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">
              No worksheets here yet. Be the first to create one!
            </p>
            <Link
              href={ctaHref}
              className="mt-4 inline-block rounded-full bg-brand-gradient px-6 py-2 text-sm font-bold text-white"
            >
              Create Now
            </Link>
          </div>
        )}
      </section>

      {/* Suggested prompts */}
      {suggestedPrompts.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <div className="rounded-3xl bg-brand-gradient p-[2px]">
            <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Try one of these ideas
              </h2>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((p) => (
                  <Link
                    key={p}
                    href={ctaHref}
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 sm:text-sm"
                  >
                    &ldquo;{p}&rdquo;
                  </Link>
                ))}
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

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
