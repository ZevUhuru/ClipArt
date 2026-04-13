import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { buildVideoJsonLd } from "@/lib/seo-jsonld";
import { CategoryNav } from "@/components/CategoryNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { AnimationDetailClient } from "./AnimationDetailClient";
import { RelatedAnimationsGrid } from "./RelatedAnimationsGrid";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

interface AnimationRow {
  id: string;
  slug: string | null;
  prompt: string;
  model: string;
  duration: number;
  video_url: string;
  preview_url: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  user_id: string;
  source: {
    id: string;
    title: string | null;
    prompt: string;
    image_url: string;
    style: string;
    category: string;
    slug: string | null;
    content_type: string | null;
  } | null;
}

interface RelatedAnimation {
  id: string;
  slug: string;
  videoUrl: string;
  posterUrl: string;
  title: string;
}

async function getAnimation(slug: string): Promise<AnimationRow | null> {
  try {
    const admin = createSupabaseAdmin();

    const { data: bySlug } = await admin
      .from("animations")
      .select(
        "id, slug, prompt, model, duration, video_url, preview_url, thumbnail_url, is_public, created_at, user_id, " +
          "source:generations!animations_source_generation_id_fkey(id, title, prompt, image_url, style, category, slug, content_type)",
      )
      .eq("slug", slug)
      .eq("status", "completed")
      .eq("is_public", true)
      .single();

    if (bySlug) return bySlug as unknown as AnimationRow;

    const { data: byId } = await admin
      .from("animations")
      .select(
        "id, slug, prompt, model, duration, video_url, preview_url, thumbnail_url, is_public, created_at, user_id, " +
          "source:generations!animations_source_generation_id_fkey(id, title, prompt, image_url, style, category, slug, content_type)",
      )
      .eq("id", slug)
      .eq("status", "completed")
      .eq("is_public", true)
      .single();

    return (byId as unknown as AnimationRow) || null;
  } catch {
    return null;
  }
}

async function getRelatedAnimations(
  currentId: string,
  limit = 8,
): Promise<RelatedAnimation[]> {
  try {
    const admin = createSupabaseAdmin();

    const { data } = await admin
      .from("animations")
      .select(
        "id, slug, prompt, video_url, preview_url, thumbnail_url, " +
          "source:generations!animations_source_generation_id_fkey(image_url, prompt, title, category, slug)",
      )
      .eq("status", "completed")
      .eq("is_public", true)
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((a: any) => {
      const src = a.source as Record<string, string> | null;
      return {
        id: a.id as string,
        slug: (a.slug || src?.slug || a.id) as string,
        videoUrl: (a.preview_url || a.video_url) as string,
        posterUrl: (src?.image_url || a.thumbnail_url || "") as string,
        title: (src?.title || a.prompt) as string,
      };
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const anim = await getAnimation(params.slug);
  if (!anim) return {};

  const animTitle = anim.source?.title || anim.prompt;
  const title =
    animTitle.slice(0, 50) + " — Free Animated Clip Art | clip.art";
  const description = `Watch and download this free animated clip art: ${animTitle}. Created with AI at clip.art — free for personal and commercial use.`;
  const path = `animations/${anim.slug || anim.id}`;
  const posterUrl =
    anim.source?.image_url || anim.thumbnail_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${path}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${path}`,
      siteName: "clip.art",
      type: "article",
      ...(posterUrl && {
        images: [{ url: posterUrl, alt: animTitle }],
      }),
      videos: [{ url: anim.video_url, type: "video/mp4" }],
    },
    twitter: {
      card: "player",
      title,
      description,
      ...(posterUrl && { images: [posterUrl] }),
    },
  };
}

function Chevron() {
  return (
    <li aria-hidden="true">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </li>
  );
}

export default async function AnimationDetailPage({ params }: PageProps) {
  const anim = await getAnimation(params.slug);
  if (!anim) notFound();

  const animTitle = anim.source?.title || anim.prompt;
  const category = anim.source?.category || "free";
  const videoUrl = anim.preview_url || anim.video_url;
  const posterUrl = anim.source?.image_url || anim.thumbnail_url || "";
  const related = await getRelatedAnimations(anim.id);
  const detailPath = `/animations/${anim.slug || anim.id}`;

  const tags = [
    category,
    "animation",
    anim.model,
    `${anim.duration}s`,
  ].filter(Boolean);

  const videoJsonLd = buildVideoJsonLd({
    title: animTitle,
    description: anim.prompt,
    thumbnailUrl: posterUrl || undefined,
    uploadDate: anim.created_at,
    contentUrl: anim.video_url,
    embedUrl: `${SITE_URL}${detailPath}`,
  });

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 py-4">
        <ol className="flex items-center gap-1.5 text-sm text-gray-400">
          <li>
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
          </li>
          <Chevron />
          <li>
            <Link href="/animations" className="hover:text-gray-600">
              Animations
            </Link>
          </li>
          <Chevron />
          <li className="truncate text-gray-600">{animTitle}</li>
        </ol>
      </nav>

      {/* Hero: two-column */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Gradient-framed video */}
          <div className="relative aspect-square">
            {/* Gradient border ring */}
            <div className="absolute inset-0 rounded-3xl bg-brand-gradient" />
            {/* Video container clipped inside the ring */}
            <div
              className="absolute inset-[2px] rounded-[22px] bg-gray-950"
              style={{ clipPath: "inset(0 round 22px)" }}
            >
              <span className="absolute left-4 top-4 z-20 flex items-center gap-1 rounded-full bg-purple-500/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                <svg
                  className="h-2.5 w-2.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                Animated
              </span>

              <video
                src={videoUrl}
                poster={posterUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* Right: Details + Actions */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              {animTitle}
            </h1>

            {/* Category badge */}
            <div className="mt-4">
              <Link
                href="/animations"
                className="inline-flex items-center rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white"
              >
                Animated Clip Art
              </Link>
            </div>

            {/* Prompt */}
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                AI Image Prompt
              </div>
              <p className="break-all text-sm leading-relaxed text-gray-600 italic">
                &ldquo;{anim.prompt}&rdquo;
              </p>
            </div>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500"
                >
                  {tag.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              ))}
            </div>

            {/* Source image */}
            {anim.source && (
              <Link
                href={
                  anim.source.content_type === "coloring"
                    ? `/coloring-pages/${anim.source.category}/${anim.source.slug || anim.source.id}`
                    : anim.source.content_type === "illustration"
                      ? `/illustrations/${anim.source.category}/${anim.source.slug || anim.source.id}`
                      : `/${category}/${anim.source.slug || anim.source.id}`
                }
                className="mt-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200"
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={anim.source.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-700">
                    Source image
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {anim.source.title || anim.source.prompt}
                  </p>
                </div>
              </Link>
            )}

            {/* Download + Share (client) */}
            <AnimationDetailClient
              slug={anim.slug || anim.id}
              videoUrl={anim.video_url}
              detailPath={detailPath}
              title={animTitle}
            />

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
                MP4 video download
              </span>
            </div>

            <p className="mt-3 text-center text-[10px] text-gray-400/70">
              Animated with{" "}
              <a
                href="https://esy.com"
                target="_blank"
                rel="noopener"
                className="transition-colors hover:text-gray-500"
              >
                ESY
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Related Animations — always show for SEO */}
      {related.length > 0 && (
        <section className="bg-gray-50/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-8 text-xl font-bold text-gray-900 sm:text-2xl">
              More animated clip art
            </h2>
            <RelatedAnimationsGrid animations={related} />
          </div>
        </section>
      )}

      {/* Generate CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own animated clip art
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Generate clip art with AI, then bring it to life with animation.
              10 free credits when you sign up.
            </p>
            <div className="mt-8">
              <Link href="/animate" className="btn-primary px-8 text-base">
                Start Animating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...videoJsonLd,
          }),
        }}
      />
    </div>
  );
}
