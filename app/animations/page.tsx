import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";
import { AnimationGrid } from "./AnimationGrid";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free Animated Clip Art — Bring Your Images to Life",
  description:
    "Browse free animated clip art created by our community. Download animated clip art for classrooms, presentations, social media, and more. Powered by AI.",
  alternates: {
    canonical: "https://clip.art/animations",
  },
  openGraph: {
    title: "Free Animated Clip Art — Bring Your Images to Life",
    description:
      "Browse and download free animated clip art. Perfect for teachers, presentations, and creative projects.",
    url: "https://clip.art/animations",
    siteName: "clip.art",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Animated Clip Art — Bring Your Images to Life",
    description:
      "Browse and download free animated clip art. Perfect for teachers, presentations, and creative projects.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
};

export interface AnimationItem {
  id: string;
  prompt: string;
  videoUrl: string;
  posterUrl: string;
  style: string;
  category: string;
  slug: string;
  aspectRatio: string;
  createdAt: string;
}

const SELECT_FIELDS =
  "id, slug, prompt, video_url, preview_url, thumbnail_url, created_at, " +
  "source:generations!animations_source_generation_id_fkey(id, image_url, prompt, style, category, slug, aspect_ratio)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(a: any): AnimationItem {
  const src = a.source as Record<string, string> | null;
  return {
    id: a.id,
    prompt: src?.prompt || a.prompt,
    videoUrl: a.preview_url || a.video_url,
    posterUrl: src?.image_url || a.thumbnail_url || "",
    style: src?.style || "flat",
    category: src?.category || "free",
    slug: a.slug || a.id,
    aspectRatio: src?.aspect_ratio || "1:1",
    createdAt: a.created_at,
  };
}

async function getAnimations(): Promise<AnimationItem[]> {
  try {
    const admin = createSupabaseAdmin();

    const { data } = await admin
      .from("animations")
      .select(SELECT_FIELDS)
      .eq("status", "completed")
      .eq("is_public", true)
      .order("is_gallery", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    return (data || []).map(mapRow);
  } catch {
    return [];
  }
}

export default async function AnimationsPage() {
  const animations = await getAnimations();

  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(168,85,247,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5">
            <svg className="h-3.5 w-3.5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
              Animations
            </span>
          </div>

          <h1 className="font-futura-bold text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block text-white">Bring your clip art</span>
            <span className="gradient-text">to life.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
            Watch static clip art transform into captivating animations.
            Perfect for classroom presentations, social media, and creative projects.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="btn-primary px-8 text-sm sm:text-base"
            >
              Create &amp; Animate
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:text-base"
            >
              Browse Clip Art
            </Link>
          </div>
        </div>
      </section>

      {/* Animation Grid */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4">
          {animations.length > 0 ? (
            <AnimationGrid animations={animations} />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center">
              <p className="text-lg font-semibold text-gray-400">
                Animations are coming soon!
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Create clip art and animate it to see it featured here.
              </p>
              <Link href="/create" className="btn-primary mt-6 inline-flex text-sm">
                Start Creating
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            How to animate clip art
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20">
                <span className="text-sm font-bold text-pink-400">01</span>
              </div>
              <h3 className="text-sm font-bold text-white">Generate clip art</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Describe what you want and pick a style. Your image is ready in seconds.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                <span className="text-sm font-bold text-purple-400">02</span>
              </div>
              <h3 className="text-sm font-bold text-white">Animate it</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Click &ldquo;Animate&rdquo; and describe the motion. Our AI brings your image to life.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                <span className="text-sm font-bold text-green-400">03</span>
              </div>
              <h3 className="text-sm font-bold text-white">Download &amp; share</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Download your animation as a video file. Use it anywhere — no attribution needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO content */}
      <section className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-2xl font-bold text-white sm:text-3xl">
            Free Animated Clip Art for Every Project
          </h2>
          <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
            clip.art&apos;s animation feature turns static clip art into eye-catching animated videos
            using AI. Teachers use animated clip art to make presentations more engaging. Content
            creators add animated stickers to social media posts. Parents and kids love watching
            their coloring page characters come to life. Every animation is free for personal and
            commercial use with no attribution required.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-3xl bg-brand-gradient p-[2px]">
            <div className="rounded-[22px] bg-[#0a0a0a] p-8 text-center sm:p-12">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to animate your clip art?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-400 sm:text-base">
                Create stunning animations from any clip art in seconds.
                10 free credits included when you sign up.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/create" className="btn-primary px-8 text-base">
                  Start Animating
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
