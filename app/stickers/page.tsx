import type { Metadata } from "next";
import Link from "next/link";
import { CategoryNav } from "@/components/CategoryNav";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free AI Sticker Generator — Create Custom Stickers | clip.art",
  description:
    "Generate custom stickers with AI. Create die-cut style sticker clip art for laptops, planners, packaging, and print on demand. Free to download, no attribution required.",
  openGraph: {
    title: "Free AI Sticker Generator — Create Custom Stickers | clip.art",
    description:
      "Generate custom sticker-style clip art with AI. Free to download for personal and commercial use.",
    url: "https://clip.art/stickers",
    siteName: "clip.art",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Free AI Sticker Generator — Custom Stickers with AI",
    description:
      "Create die-cut style sticker clip art with AI. Free to download.",
  },
  alternates: {
    canonical: "https://clip.art/stickers",
  },
};

interface StickerImage {
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

async function getFeaturedStickers(): Promise<StickerImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select(
        "id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at"
      )
      .eq("style", "sticker")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(12);
    return (data || []) as StickerImage[];
  } catch {
    return [];
  }
}

const USE_CASES = [
  "Laptop Stickers",
  "Planner Stickers",
  "Print on Demand",
  "Packaging & Labels",
  "Scrapbooking",
  "Social Media",
];

const PROMPT_IDEAS = [
  { prompt: "cute cat astronaut floating in space", label: "Cat Astronaut" },
  { prompt: "kawaii coffee cup with a happy face", label: "Kawaii Coffee" },
  { prompt: "retro sunset palm tree vibes", label: "Retro Sunset" },
  { prompt: "golden retriever puppy with a flower crown", label: "Puppy Crown" },
  { prompt: "slice of pizza with sunglasses", label: "Cool Pizza" },
  { prompt: "succulent plant in a tiny pot", label: "Succulent" },
  { prompt: "rainbow donut with sprinkles", label: "Rainbow Donut" },
  { prompt: "mushroom house in a forest", label: "Mushroom House" },
];

export default async function StickersLanding() {
  const featured = await getFeaturedStickers();

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Free AI{" "}
          <span className="gradient-text">Sticker Generator</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Create custom die-cut style stickers with AI. Describe any subject and
          get a vibrant sticker illustration with bold outlines in seconds —
          perfect for laptops, planners, packaging, and print on demand.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/create?style=sticker"
            className="btn-primary text-base"
          >
            Create a Sticker
          </Link>
        </div>
      </section>

      {/* Use-case chips */}
      <section className="mx-auto max-w-4xl px-4 pb-12">
        <div className="flex flex-wrap justify-center gap-2">
          {USE_CASES.map((uc) => (
            <span
              key={uc}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-600"
            >
              {uc}
            </span>
          ))}
        </div>
      </section>

      {/* Featured Gallery */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Recently created stickers
          </h2>
          <ImageGrid>
            {featured.map((img) => (
              <ImageCard
                key={img.id}
                image={{
                  slug: img.slug || img.id,
                  title: img.title || img.prompt,
                  url: img.image_url,
                  category: img.category,
                  style: "sticker",
                  aspect_ratio: img.aspect_ratio || "1:1",
                }}
                href={`/${img.category}/${img.slug || img.id}`}
              />
            ))}
          </ImageGrid>
        </section>
      )}

      {/* Prompt Ideas */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
          Sticker prompt ideas
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-gray-500">
          Click any prompt to open it in the generator with the Sticker style
          pre-selected.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROMPT_IDEAS.map((idea) => (
            <Link
              key={idea.prompt}
              href={`/create?prompt=${encodeURIComponent(idea.prompt)}&style=sticker`}
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                {idea.label}
              </p>
              <p className="mt-1 text-xs text-gray-400 group-hover:text-pink-400">
                &ldquo;{idea.prompt}&rdquo;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create your own stickers
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Describe any subject — an animal, food, character, or object — and
              our AI will generate a vibrant sticker illustration. 15 free
              generations when you sign up.
            </p>
            <div className="mt-8">
              <Link
                href="/create?style=sticker"
                className="btn-primary px-8 text-base"
              >
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          clip.art&apos;s AI sticker generator creates unique, die-cut style
          sticker illustrations from any text description. Each sticker features
          bold outlines, vibrant colors, and the signature thick-border look that
          makes sticker art stand out. Whether you need cute animal stickers,
          food stickers, motivational quote art, or character designs, our AI
          delivers high-quality results in seconds. All stickers are generated on
          a clean white background, ready to use in digital projects or send to a
          print shop.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          Sticker-style clip art is popular with Etsy sellers for print on demand
          sticker sheets, with planners for decorative stickers, and with
          designers for social media graphics and packaging. Every sticker you
          generate on clip.art is free for personal and commercial use — no
          attribution required. Create laptop stickers, water bottle decals,
          planner decorations, and more. Simply describe what you want, and
          download your custom sticker art instantly.
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
