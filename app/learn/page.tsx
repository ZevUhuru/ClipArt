import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Play, Clock } from "lucide-react";
import { getAllPosts, getAllTopics, formatDuration } from "@/lib/learn";
import { VideoCard } from "@/components/learn/VideoCard";
import { SignUpCTA } from "@/components/learn/SignUpCTA";

export const metadata: Metadata = {
  title: "Learn — AI Clip Art Tutorials, Prompts & Guides | clip.art",
  description:
    "Watch tutorials, discover AI art prompts, and learn how to create stunning clip art and coloring pages with clip.art. Free guides for teachers, designers, and creators.",
  openGraph: {
    title: "Learn — AI Clip Art Tutorials, Prompts & Guides",
    description:
      "Watch tutorials, discover AI art prompts, and learn how to create stunning clip art and coloring pages.",
    url: "https://clip.art/learn",
    siteName: "clip.art",
    type: "website",
  },
  alternates: { canonical: "https://clip.art/learn" },
};

const TOPIC_LABELS: Record<string, string> = {
  prompts: "Prompts",
  seasonal: "Seasonal",
  coloring: "Coloring Pages",
  teachers: "Teachers",
  pod: "Print on Demand",
  guide: "Guides",
};

export default function LearnHub() {
  const posts = getAllPosts();
  const topics = getAllTopics();
  const featured = posts[0];
  const rest = posts.slice(1);

  const featuredThumb =
    featured?.thumbnailUrl ||
    (featured?.muxPlaybackId
      ? `https://image.mux.com/${featured.muxPlaybackId}/thumbnail.jpg?time=0`
      : null);

  return (
    <>
      {/* ═══ Hero ═══ */}
      <section className="relative pb-8 pt-24 sm:pb-10 sm:pt-28">
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at center, black 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-5 text-xs text-gray-400 sm:mb-8">
            <Link href="/" className="transition-colors hover:text-gray-600">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-600">Learn</span>
          </nav>

          <h1 className="font-futura-bold text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            clip.art{" "}
            <span className="gradient-text">Learn</span>
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Tutorials, prompts, and guides to get the most out of AI clip art
            and coloring pages. Step by step, no experience needed.
          </p>
        </div>
      </section>

      {/* ═══ Featured Tutorial ═══ */}
      {featured && (
        <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-8 sm:pb-12">
          <Link
            href={`/learn/${featured.slug}`}
            className="group block"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="grid overflow-hidden rounded-2xl border border-gray-200 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:-translate-y-1 group-hover:border-pink-300 group-hover:shadow-lg sm:grid-cols-[1.4fr_1fr]">
              {/* Thumbnail */}
              <div className="relative min-h-[180px] overflow-hidden bg-gray-900 sm:min-h-[280px] lg:min-h-[340px]">
                {featuredThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredThumb}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/90 shadow-lg sm:h-20 sm:w-20">
                      <Play
                        size={32}
                        color="#fff"
                        fill="#fff"
                        className="ml-0.5"
                      />
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-2.5 py-1 font-mono text-[13px] text-white">
                  {formatDuration(featured.durationSeconds)}
                </div>

                {/* Featured badge */}
                <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-pink-600">
                  Featured
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col justify-center bg-gray-50 p-6 sm:p-8 lg:p-10">
                {featured.categoryLabel && (
                  <span className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-pink-600">
                    {featured.categoryLabel}
                  </span>
                )}

                <h2 className="font-futura-bold text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
                  {featured.title}
                </h2>

                <p className="mt-3 hidden text-[15px] leading-relaxed text-gray-500 sm:block">
                  {featured.description}
                </p>

                <div className="mt-4 flex items-center justify-between sm:mt-6">
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Clock size={14} />
                    {formatDuration(featured.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-2 text-[15px] font-medium text-pink-600 transition-colors group-hover:text-pink-700">
                    Watch now
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ═══ All Tutorials ═══ */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-8 sm:pb-16">
        <div className="mb-5 border-b border-gray-200 pb-4 sm:mb-8">
          <h2 className="font-futura-bold text-lg font-medium text-gray-900">
            All Tutorials
          </h2>
        </div>

        {/* Topic chips */}
        {topics.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
            {topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600"
              >
                {TOPIC_LABELS[t] || t}
              </span>
            ))}
          </div>
        )}

        {rest.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <VideoCard key={post.slug} post={post} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            Tutorials coming soon. Check back shortly.
          </p>
        ) : null}
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="border-y border-white/10 bg-[#0a0a0a] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-futura-bold text-xl font-semibold text-white sm:text-2xl lg:text-3xl">
            Start creating. 15 free generations.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-white/70 sm:text-base">
            Describe what you want and download it in seconds. No attribution
            required, free for personal and commercial use.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-[15px] font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              Generate Clip Art
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/create/coloring-pages"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-[15px] font-medium text-white transition-all hover:bg-white/10"
            >
              Create Coloring Pages
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Newsletter / CTA strip ═══ */}
      <SignUpCTA variant="strip" />
    </>
  );
}
