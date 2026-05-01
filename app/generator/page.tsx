import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CategoryNav } from "@/components/CategoryNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Clip Art Generator | clip.art",
  description:
    "Create free transparent clip art with AI. Describe any object, character, classroom resource, sticker, or design asset and download ready-to-use PNG artwork.",
  alternates: { canonical: buildCanonical("generator") },
  openGraph: {
    title: "AI Clip Art Generator | clip.art",
    description:
      "Generate free transparent clip art for classrooms, shops, printables, crafts, and everyday creative projects.",
    url: buildCanonical("generator"),
    siteName: SITE_NAME,
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Clip Art Generator | clip.art",
    description:
      "Create free transparent clip art with AI and download ready-to-use PNG artwork.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

interface GalleryImage {
  id: string;
  title: string | null;
  prompt: string;
  image_url: string;
  transparent_image_url: string | null;
  slug: string | null;
  category: string | null;
}

const PROMPT_IDEAS = [
  "A friendly fox detective holding a magnifying glass",
  "Cute school bus clip art for a classroom worksheet",
  "Watercolor strawberry sticker with transparent background",
  "Vintage flower bouquet for an invitation design",
];

const USE_CASES = [
  "Classroom worksheets",
  "Craft shop listings",
  "Birthday invitations",
  "Social posts",
  "Sticker sheets",
  "Design bundles",
];

async function getRecentClipArt(): Promise<GalleryImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("id, title, prompt, image_url, transparent_image_url, slug, category")
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .order("created_at", { ascending: false })
      .limit(8);

    return (data || []) as GalleryImage[];
  } catch {
    return [];
  }
}

function imageHref(image: GalleryImage) {
  return `/${image.category || "free"}/${image.slug || image.id}`;
}

export default async function GeneratorLandingPage() {
  const recentImages = await getRecentClipArt();

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <CategoryNav />

      <main>
        <section className="relative overflow-hidden border-b border-gray-100 bg-[#fbfaf7]">
          <div className="absolute left-[-10rem] top-[-12rem] h-96 w-96 rounded-full bg-pink-200/30 blur-3xl" />
          <div className="absolute right-[-10rem] top-20 h-96 w-96 rounded-full bg-orange-200/25 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/80 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-pink-600 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Free AI generator
              </span>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
                Create transparent{" "}
                <span className="bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  clip art
                </span>{" "}
                in seconds.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                Describe what you need and generate reusable PNG clip art for classrooms, craft shops,
                stickers, social posts, printables, and design bundles.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center rounded-2xl bg-gray-950 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-gray-950/15 transition-all hover:-translate-y-0.5 hover:bg-gray-800"
                >
                  Start generating
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-2xl border border-pink-100 bg-white px-6 py-3.5 text-sm font-black text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200"
                >
                  Browse examples
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {USE_CASES.map((useCase) => (
                  <span
                    key={useCase}
                    className="rounded-full border border-pink-100 bg-white/75 px-3 py-1.5 text-xs font-bold text-gray-600"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-pink-100/60 ring-1 ring-gray-200/70">
              <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                    Try a prompt
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    {PROMPT_IDEAS[0]}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  {(recentImages.length > 0 ? recentImages : []).slice(0, 8).map((image) => (
                    <Link
                      key={image.id}
                      href={imageHref(image)}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-transparency-grid ring-1 ring-gray-200"
                      aria-label={`View ${image.title || image.prompt}`}
                      title={`View ${image.title || image.prompt}`}
                    >
                      <Image
                        src={image.transparent_image_url || image.image_url}
                        alt={image.title || image.prompt}
                        fill
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 1024px) 25vw, 160px"
                      />
                    </Link>
                  ))}
                  {recentImages.length === 0 &&
                    Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-2xl bg-gradient-to-br from-pink-50 via-orange-50 to-white ring-1 ring-gray-100"
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f7f9]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Describe anything", "Turn a simple prompt into reusable artwork for your project."],
                ["Download PNGs", "Use transparent assets in worksheets, listings, posts, and printables."],
                ["Build packs", "Group matching generations into design bundles and themed collections."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[2rem] border border-white bg-white p-6 shadow-sm ring-1 ring-gray-200/60">
                  <h2 className="text-lg font-black tracking-tight text-gray-950">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[2rem] border border-pink-100 bg-white p-6 shadow-sm ring-1 ring-gray-200/60 md:flex md:items-center md:justify-between md:gap-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500">
                  Generator to bundle workflow
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                  Start with one asset. Grow it into a pack.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                  The generator is the starting point for individual clip art. Packs and Design Bundles
                  turn related generations into a stronger downloadable product.
                </p>
              </div>
              <Link
                href="/design-bundles"
                className="mt-5 inline-flex shrink-0 rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-gray-800 md:mt-0"
              >
                Explore Design Bundles
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
