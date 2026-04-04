import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { buildVideoJsonLd } from "@/lib/seo-jsonld";
import { AnimationDetailClient } from "./AnimationDetailClient";

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
  } | null;
}

async function getAnimation(slug: string): Promise<AnimationRow | null> {
  try {
    const admin = createSupabaseAdmin();

    const { data: bySlug } = await admin
      .from("animations")
      .select(
        "id, slug, prompt, model, duration, video_url, preview_url, thumbnail_url, is_public, created_at, user_id, " +
          "source:generations!animations_source_generation_id_fkey(id, title, prompt, image_url, style, category, slug)",
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
          "source:generations!animations_source_generation_id_fkey(id, title, prompt, image_url, style, category, slug)",
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

interface RelatedAnimation {
  id: string;
  slug: string;
  videoUrl: string;
  posterUrl: string;
  prompt: string;
}

async function getRelatedAnimations(
  currentId: string,
  category: string,
  limit = 8,
): Promise<RelatedAnimation[]> {
  try {
    const admin = createSupabaseAdmin();
    const catPattern = `%${category.replace(/-/g, " ")}%`;

    const { data } = await admin
      .from("animations")
      .select(
        "id, slug, prompt, video_url, preview_url, thumbnail_url, " +
          "source:generations!animations_source_generation_id_fkey(image_url, prompt, category, slug)",
      )
      .eq("status", "completed")
      .eq("is_public", true)
      .neq("id", currentId)
      .or(
        `prompt.ilike.${catPattern}`,
      )
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
        prompt: (src?.prompt || a.prompt) as string,
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

  const title =
    (anim.source?.title || anim.prompt).slice(0, 55) +
    " — Animated Clip Art | clip.art";
  const description = `Watch and download this free animated clip art: ${anim.source?.title || anim.prompt}. Created with AI at clip.art.`;
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
        images: [{ url: posterUrl, alt: anim.source?.title || anim.prompt }],
      }),
      videos: [
        {
          url: anim.video_url,
          type: "video/mp4",
        },
      ],
    },
    twitter: {
      card: "player",
      title,
      description,
      ...(posterUrl && { images: [posterUrl] }),
    },
  };
}

export default async function AnimationDetailPage({ params }: PageProps) {
  const anim = await getAnimation(params.slug);
  if (!anim) notFound();

  const animTitle = anim.source?.title || anim.prompt;
  const category = anim.source?.category || "free";
  const videoUrl = anim.preview_url || anim.video_url;
  const posterUrl = anim.source?.image_url || anim.thumbnail_url || "";
  const related = await getRelatedAnimations(anim.id, category);
  const detailPath = `/animations/${anim.slug || anim.id}`;

  const videoJsonLd = buildVideoJsonLd({
    title: animTitle,
    description: anim.prompt,
    thumbnailUrl: posterUrl || undefined,
    uploadDate: anim.created_at,
    contentUrl: anim.video_url,
    embedUrl: `${SITE_URL}${detailPath}`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...videoJsonLd,
          }),
        }}
      />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/animations" className="hover:text-gray-600">
            Animations
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{animTitle}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Video */}
          <div className="overflow-hidden rounded-2xl bg-gray-900">
            <video
              src={videoUrl}
              poster={posterUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="aspect-video w-full object-contain"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <h1 className="font-futura text-2xl font-bold text-gray-900">
              {animTitle}
            </h1>

            <p className="text-sm leading-relaxed text-gray-500">
              {anim.prompt}
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-purple-100 px-2.5 py-1 font-medium text-purple-700">
                {category}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                {anim.model}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                {anim.duration}s
              </span>
            </div>

            {/* Source image */}
            {anim.source && (
              <Link
                href={`/${category}/${anim.source.slug || anim.source.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anim.source.image_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
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

            {/* Actions — client component for interactivity */}
            <AnimationDetailClient
              animationId={anim.id}
              title={animTitle}
              prompt={anim.prompt}
              category={category}
              videoUrl={anim.video_url}
              thumbnailUrl={posterUrl}
              slug={anim.slug || anim.id}
              detailPath={detailPath}
            />
          </div>
        </div>

        {/* Related animations */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-futura text-lg font-bold text-gray-900">
              Related Animations
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/animations/${r.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-900/5 ring-1 ring-gray-200 transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-purple-400/40"
                >
                  <video
                    src={r.videoUrl}
                    poster={r.posterUrl}
                    muted
                    loop
                    playsInline
                    preload="none"
                    className="absolute inset-0 h-full w-full object-contain"
                    onMouseOver={(e) =>
                      (e.target as HTMLVideoElement).play().catch(() => {})
                    }
                    onMouseOut={(e) =>
                      (e.target as HTMLVideoElement).pause()
                    }
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="line-clamp-2 text-xs font-medium text-white">
                      {r.prompt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* License */}
        <p className="mt-10 text-center text-xs text-gray-300">
          Free for personal and commercial use. No attribution required.
        </p>
      </div>
    </>
  );
}
