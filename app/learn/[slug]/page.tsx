import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getAllPosts, getPostBySlug, formatDuration } from "@/lib/learn";
import { MuxVideoPlayer } from "@/components/learn/MuxVideoPlayer";
import { TranscriptToggle } from "@/components/learn/TranscriptToggle";
import { PromptCard } from "@/components/learn/PromptCard";
import { RelatedVideos } from "@/components/learn/RelatedVideos";
import { SignUpCTA } from "@/components/learn/SignUpCTA";
import styles from "@/components/learn/article.module.css";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  const { meta } = post;
  const url = `https://clip.art/learn/${meta.slug}`;

  return {
    title: `${meta.title} | clip.art Learn`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: "clip.art",
      type: "article",
      images: meta.thumbnailUrl ? [{ url: meta.thumbnailUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: { canonical: url },
  };
}

const TOPIC_LABELS: Record<string, string> = {
  prompts: "Prompts",
  seasonal: "Seasonal",
  coloring: "Coloring Pages",
  teachers: "Teachers",
  pod: "Print on Demand",
  guide: "Guides",
};

const mdxComponents = {
  PromptCard,
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const id =
      typeof props.children === "string"
        ? props.children
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "")
        : undefined;
    return <h2 id={id} className="scroll-mt-20" {...props} />;
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const id =
      typeof props.children === "string"
        ? props.children
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "")
        : undefined;
    return <h3 id={id} className="scroll-mt-20" {...props} />;
  },
};

export default function LearnArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const { meta, content, transcript } = post;
  const allPosts = getAllPosts();
  const relatedPosts =
    meta.relatedSlugs.length > 0
      ? allPosts.filter((p) => meta.relatedSlugs.includes(p.slug))
      : allPosts;

  const url = `https://clip.art/learn/${meta.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoObject",
        name: meta.title,
        description: meta.description,
        thumbnailUrl: meta.thumbnailUrl
          ? `https://clip.art${meta.thumbnailUrl}`
          : undefined,
        uploadDate: meta.date,
        duration: meta.duration
          ? `PT${meta.duration.replace(":", "M")}S`
          : undefined,
        contentUrl: meta.muxPlaybackId
          ? `https://stream.mux.com/${meta.muxPlaybackId}.m3u8`
          : undefined,
        embedUrl: url,
      },
      {
        "@type": "Article",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        author: { "@type": "Person", name: meta.author.name },
        publisher: {
          "@type": "Organization",
          name: "clip.art",
          url: "https://clip.art",
        },
        mainEntityOfPage: url,
      },
      {
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
            name: "Learn",
            item: "https://clip.art/learn",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: meta.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══ Breadcrumb bar ═══ */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-8 sm:py-3.5">
          <nav className="text-xs text-gray-400">
            <Link
              href="/"
              className="transition-colors hover:text-gray-600"
            >
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <Link
              href="/learn"
              className="transition-colors hover:text-gray-600"
            >
              Learn
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-600 line-clamp-1">
              {meta.title}
            </span>
          </nav>
        </div>
      </div>

      {/* ═══ Video theater ═══ */}
      <div className="w-full bg-black">
        <div className="mx-auto max-w-5xl">
          <MuxVideoPlayer
            playbackId={meta.muxPlaybackId}
            title={meta.title}
            poster={meta.thumbnailUrl}
            durationSeconds={meta.durationSeconds}
          />
        </div>
      </div>

      {/* ═══ Transcript toggle ═══ */}
      {transcript && (
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <TranscriptToggle transcript={transcript} />
        </div>
      )}

      {/* ═══ CTA strip ═══ */}
      <SignUpCTA variant="strip" />

      {/* ═══ Main + Sidebar ═══ */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-12">
          {/* Main content */}
          <article className="min-w-0" style={{ overflowWrap: "break-word" }}>
            {/* Title */}
            <h1 className="font-futura-bold text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
              {meta.title}
            </h1>

            {/* Author row */}
            <div className="mt-4 flex items-center gap-3">
              {meta.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.author.avatar}
                  alt={meta.author.name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : meta.author.name ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-xs font-bold text-white">
                  {meta.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              ) : null}
              <div className="flex flex-col gap-px">
                <span className="text-sm font-semibold leading-snug text-gray-900">
                  {meta.author.name}
                </span>
                {meta.author.role && (
                  <span className="text-xs leading-snug text-gray-400">
                    {meta.author.role}
                  </span>
                )}
              </div>
            </div>

            {/* Meta: date, duration, tags */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-gray-500 sm:gap-4 sm:text-sm">
              {meta.date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(meta.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {meta.durationSeconds > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {formatDuration(meta.durationSeconds)}
                </span>
              )}
              {meta.topic.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {meta.topic.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-medium text-pink-600"
                    >
                      {TOPIC_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {meta.description && (
              <p className="mt-5 text-[15px] leading-relaxed text-gray-500 sm:mt-6">
                {meta.description}
              </p>
            )}

            {/* MDX body */}
            <div className={`${styles.article} mt-8`}>
              <MDXRemote source={content} components={mdxComponents} />
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center sm:p-8">
                <h3 className="font-futura-bold text-xl font-semibold text-gray-900 sm:text-2xl">
                  Try this yourself
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  15 free generations. Describe what you want and download it in
                  seconds.
                </p>
                <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                  >
                    Generate Clip Art
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/create/coloring-pages"
                    className="inline-flex rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
                  >
                    Create Coloring Pages
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-auto">
            <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-128px)] lg:overflow-y-auto">
              <div className="space-y-6">
                <RelatedVideos posts={relatedPosts} currentSlug={meta.slug} />
                <SignUpCTA variant="block" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
