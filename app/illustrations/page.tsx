import type { Metadata } from "next";
import Link from "next/link";
import { getIllustrationCategories } from "@/lib/categories";
import { CategoryNav } from "@/components/CategoryNav";
import { IllustrationMosaicGrid } from "@/components/IllustrationMosaicGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free AI Illustrations — AI Illustration Generator",
  description:
    "Create and download free AI-generated illustrations with detailed backgrounds and scenes. Generate custom storybook, fantasy, watercolor, and digital illustrations in seconds.",
  openGraph: {
    title: "Free AI Illustrations — AI Illustration Generator",
    description:
      "Create stunning AI-generated illustrations with detailed backgrounds. Storybook, fantasy, watercolor, and more — generated in seconds.",
    url: "https://clip.art/illustrations",
    siteName: "clip.art",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Illustrations — AI Illustration Generator",
    description:
      "Create custom AI illustrations with detailed backgrounds and scenes. Free to download.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  alternates: {
    canonical: "https://clip.art/illustrations",
  },
};

interface FeaturedImage {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  style: string;
  category: string;
  slug: string | null;
  aspect_ratio: string;
  created_at: string;
}

async function getFeaturedIllustrations(): Promise<FeaturedImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at")
      .eq("content_type", "illustration")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(12);
    return (data || []) as FeaturedImage[];
  } catch {
    return [];
  }
}

export default async function IllustrationsLanding() {
  const [categories, featured] = await Promise.all([
    getIllustrationCategories(),
    getFeaturedIllustrations(),
  ]);

  const activeCategories = categories.filter((c) => c.slug !== "illustration-free");

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Free AI{" "}
          <span className="gradient-text">Illustrations</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Create stunning illustrations with detailed backgrounds and environments
          using AI. Choose from storybook, fantasy, watercolor, anime, and more —
          perfect for storytelling, content creation, and animation.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create/illustrations" className="btn-primary text-base">
            Create an Illustration
          </Link>
        </div>
      </section>

      {/* Category Grid */}
      {activeCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Browse by category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {activeCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/illustrations/${cat.slug}`}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                  {cat.name}
                </p>
                <p className="mt-1 text-xs text-gray-400">Illustrations</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Gallery */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Recently created illustrations
          </h2>
          <IllustrationMosaicGrid
            items={featured.map((img) => ({
              slug: img.slug || img.id,
              title: img.title || img.prompt,
              url: img.image_url,
              category: img.category,
              aspect_ratio: img.aspect_ratio || "4:3",
            }))}
          />
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own illustrations
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Describe any scene, environment, or story moment and our AI will
              generate a full illustration with detailed background. Choose from
              16 unique styles. 10 free credits when you sign up.
            </p>
            <div className="mt-8">
              <Link href="/create/illustrations" className="btn-primary px-8 text-base">
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          clip.art&apos;s AI illustration generator creates unique, high-quality
          illustrations with detailed backgrounds and environments from any text
          description. Unlike clip art (which is designed to be portable with
          white backgrounds), illustrations are complete compositions — full
          scenes with lighting, atmosphere, and context. Choose from styles like
          storybook, fantasy, watercolor, anime, collage, gouache, and more.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          All illustrations are free to download and use for personal or
          commercial purposes. Perfect for children&apos;s books, storytelling,
          social media content, presentations, animation source material, and
          creative projects. Generate illustrations in landscape, portrait, or
          square formats.
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
