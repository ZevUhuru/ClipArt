import type { Metadata } from "next";
import Link from "next/link";
import { getColoringThemes } from "@/lib/categories";
import { CategoryNav } from "@/components/CategoryNav";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free Coloring Pages — AI Coloring Page Generator | clip.art",
  description:
    "Create and download free printable coloring pages with AI. Generate custom coloring sheets for kids, adults, classrooms, and relaxation — dinosaurs, unicorns, mandalas, and more.",
  openGraph: {
    title: "Free Coloring Pages — AI Coloring Page Generator | clip.art",
    description:
      "Create and download free printable coloring pages with AI. Generate custom coloring sheets for any theme instantly.",
    url: "https://clip.art/coloring-pages",
    siteName: "clip.art",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Free Coloring Pages — AI Coloring Page Generator",
    description:
      "Create custom printable coloring pages with AI. Free to download and print.",
  },
  alternates: {
    canonical: "https://clip.art/coloring-pages",
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

async function getFeaturedColoringPages(): Promise<FeaturedImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at")
      .eq("style", "coloring")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(12);
    return (data || []) as FeaturedImage[];
  } catch {
    return [];
  }
}

export default async function ColoringPagesLanding() {
  const [themes, featured] = await Promise.all([
    getColoringThemes(),
    getFeaturedColoringPages(),
  ]);

  const activeThemes = themes.filter((t) => t.slug !== "coloring-free");

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Free AI{" "}
          <span className="gradient-text">Coloring Pages</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Create custom printable coloring pages with AI. Describe any scene and
          get a beautiful coloring page with bold outlines in seconds — perfect
          for kids, classrooms, and relaxation.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create/coloring-pages" className="btn-primary text-base">
            Create a Coloring Page
          </Link>
        </div>
      </section>

      {/* Theme Grid */}
      {activeThemes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Browse by theme
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {activeThemes.map((theme) => (
              <Link
                key={theme.slug}
                href={`/coloring-pages/${theme.slug}`}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                  {theme.name}
                </p>
                <p className="mt-1 text-xs text-gray-400">Coloring Pages</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Gallery */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Recently created coloring pages
          </h2>
          <ImageGrid variant="coloring">
            {featured.map((img) => (
              <ImageCard
                key={img.id}
                image={{
                  slug: img.slug || img.id,
                  title: img.title || img.prompt,
                  url: img.image_url,
                  category: img.category,
                  style: "coloring",
                  aspect_ratio: img.aspect_ratio || "3:4",
                }}
                variant="coloring"
                href={`/coloring-pages/${img.category}/${img.slug || img.id}`}
              />
            ))}
          </ImageGrid>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own coloring pages
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Describe any scene, character, or pattern and our AI will generate
              a printable coloring page with bold outlines. 10 free credits
              when you sign up.
            </p>
            <div className="mt-8">
              <Link href="/create/coloring-pages" className="btn-primary px-8 text-base">
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          clip.art&apos;s AI coloring page generator creates unique, printable
          coloring sheets from any text description. Whether you need dinosaur
          coloring pages for a classroom activity, mandala patterns for adult
          relaxation, or unicorn designs for a birthday party, our generator
          delivers high-quality pages with clean, bold outlines designed for
          easy coloring. Each page is generated in portrait format, optimized
          for printing on standard letter or A4 paper.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          All coloring pages are free to download and use for personal or
          commercial purposes. Teachers, parents, and content creators can
          generate unlimited custom coloring sheets covering any theme —
          animals, holidays, fantasy, nature, space, and more. Simply describe
          what you want and download a printable coloring page in seconds.
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
