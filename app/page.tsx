import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Generator } from "@/components/Generator";
import { MosaicBackground, type MosaicAnimation } from "@/components/MosaicBackground";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { AnimationGrid } from "./animations/AnimationGrid";
import { getAllCategories, getColoringThemes, type DbCategory } from "@/lib/categories";
import { getAllPosts } from "@/lib/learn";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { sampleImages } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";

export const revalidate = 60;

interface CommunityImage {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  style: string;
  category: string;
  slug: string | null;
  aspect_ratio: string;
}

async function getCommunityGallery(): Promise<CommunityImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data: featured } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .eq("is_featured", true)
      .neq("style", "coloring")
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8);

    if (featured && featured.length >= 8) return featured as CommunityImage[];

    const featuredList = (featured || []) as CommunityImage[];
    const existing = new Set(featuredList.map((f) => f.id));
    const remaining = 8 - featuredList.length;
    const { data: recent } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .neq("style", "coloring")
      .eq("is_featured", false)
      .order("created_at", { ascending: false })
      .limit(remaining);

    const recentList = (recent || []) as CommunityImage[];
    return [...featuredList, ...recentList.filter((r) => !existing.has(r.id))].slice(0, 8);
  } catch {
    return [];
  }
}

async function getColoringGallery(): Promise<CommunityImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data: featured } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .eq("is_featured", true)
      .eq("style", "coloring")
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8);

    if (featured && featured.length >= 8) return featured as CommunityImage[];

    const featuredList = (featured || []) as CommunityImage[];
    const existing = new Set(featuredList.map((f) => f.id));
    const remaining = 8 - featuredList.length;
    const { data: recent } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .eq("style", "coloring")
      .eq("is_featured", false)
      .order("created_at", { ascending: false })
      .limit(remaining);

    const recentList = (recent || []) as CommunityImage[];
    return [...featuredList, ...recentList.filter((r) => !existing.has(r.id))].slice(0, 8);
  } catch {
    return [];
  }
}

interface HomepageAnimation {
  id: string;
  videoUrl: string;
  posterUrl: string;
  prompt: string;
  style: string;
  category: string;
  slug: string;
}

async function getAnimationShowcase(): Promise<HomepageAnimation[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("animations")
      .select(
        "id, prompt, video_url, preview_url, thumbnail_url, " +
          "source:generations!animations_source_generation_id_fkey(id, image_url, prompt, style, category, slug)",
      )
      .eq("status", "completed")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((a: any) => {
      const src = a.source as Record<string, string> | null;
      return {
        id: a.id,
        videoUrl: a.preview_url || a.video_url,
        posterUrl: src?.image_url || a.thumbnail_url || "",
        prompt: src?.prompt || a.prompt,
        style: src?.style || "flat",
        category: src?.category || "free",
        slug: src?.slug || a.id,
      };
    });
  } catch {
    return [];
  }
}

const faqItems = [
  {
    q: "Is clip.art really free?",
    a: "Yes! You get 10 free credits with no sign-up required. After that, credit packs start at $0.99 for 15 generations. Every image you create is free for personal and commercial use — no attribution needed.",
  },
  {
    q: "What can I use the clip art for?",
    a: "Anything you want. Teachers use it for worksheets and classroom decorations. Print-on-demand sellers create designs for t-shirts, stickers, and mugs. Parents make coloring pages and crafts. There are no licensing restrictions.",
  },
  {
    q: "How does the AI generation work?",
    a: "Describe what you want in plain English — like \"cute puppy playing in a garden\" — and our AI generates a high-quality image in seconds. You can choose from multiple styles including flat, cartoon, watercolor, 3D, and more.",
  },
  {
    q: "What are coloring pages?",
    a: "Our coloring page generator creates printable pages with bold, clean outlines designed for easy coloring. They're generated in portrait format, optimized for standard letter or A4 paper. Perfect for classrooms, relaxation, and kids' activities.",
  },
  {
    q: "Can I use these for commercial projects?",
    a: "Absolutely. Every image generated on clip.art is free for commercial use. Use them in products, marketing materials, merchandise, or any project — no attribution or extra licensing required.",
  },
  {
    q: "What image formats do you support?",
    a: "All images are generated as high-quality PNG files with transparent or white backgrounds, ready for immediate use in design projects, documents, and printing.",
  },
];

export default async function Home() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/create");

  const [categories, coloringThemes, clipArtImages, coloringImages, learnPosts, animationItems] = await Promise.all([
    getAllCategories(),
    getColoringThemes(),
    getCommunityGallery(),
    getColoringGallery(),
    Promise.resolve(getAllPosts()),
    getAnimationShowcase(),
  ]);

  const activeThemes = coloringThemes.filter((t) => t.slug !== "coloring-free");
  const hasClipArt = clipArtImages.length > 0;
  const hasColoring = coloringImages.length > 0;

  const fallbackClipArt = sampleImages.slice(0, 8);

  const mosaicAnimations: MosaicAnimation[] = animationItems.map((a) => ({
    videoUrl: a.videoUrl,
    posterUrl: a.posterUrl,
  }));

  return (
    <main className="relative bg-[#0a0a0a]">
      <MosaicBackground animations={mosaicAnimations} />

      {/* ───── DARK ZONE: Hero + Generator ───── */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <Nav />
        <div className="flex flex-1 items-center justify-center px-3 py-4 pb-8 sm:px-4 sm:py-6 sm:pb-16">
          <div className="w-full max-w-xl">
            <div className="mb-4 text-center sm:mb-6">
              <div className="mb-3 flex justify-center sm:mb-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/[0.12] px-3 py-1.5 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 sm:h-7 sm:w-7">
                    <svg className="h-3 w-3 text-black sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <div className="text-left leading-tight">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-100 sm:text-xs">
                      10 free credits
                    </p>
                    <p className="text-[10px] text-amber-200/80 sm:text-[11px]">Included when you sign up</p>
                  </div>
                </div>
              </div>
              <h1 className="font-futura-bold text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Generate Clip Art</span>
                <span className="gradient-text">In Seconds.</span>
              </h1>
              <p className="mt-2 text-xs text-gray-300 sm:hidden">
                Describe it, generate, download.
              </p>
            </div>

            <div className="mb-5 hidden grid-cols-3 gap-3 sm:grid">
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-pink-400">Step 01</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Describe</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Step 02</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Generate</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-green-400">Step 03</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Download</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white p-3 shadow-[0_0_80px_rgba(255,138,101,0.15)] sm:rounded-3xl sm:p-8">
              <Suspense>
                <Generator />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* ───── TRANSITION ───── */}
      <div className="relative z-10">
        <div className="h-32 bg-gradient-to-b from-[#0a0a0a] to-white sm:h-40" />
      </div>

      {/* ───── WHITE ZONE ───── */}
      <div className="relative z-10 bg-white">

        {/* ── CLIP ART SHOWCASE ── */}
        <section className="pb-20 pt-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-pink-500">Clip Art</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  AI-generated clip art in any style
                </h2>
              </div>
              <Link href="/create" className="shrink-0 text-sm font-semibold text-pink-600 hover:text-pink-700">
                Create your own &rarr;
              </Link>
            </div>

            <ImageGrid className="mt-8">
              {(hasClipArt ? clipArtImages : fallbackClipArt).map((img) => {
                const isDb = "id" in img && "image_url" in img;
                const src = isDb ? (img as CommunityImage).image_url : (img as typeof sampleImages[0]).url;
                const title = isDb ? ((img as CommunityImage).title || (img as CommunityImage).prompt) : (img as typeof sampleImages[0]).title;
                const slug = isDb ? ((img as CommunityImage).slug || (img as CommunityImage).id) : (img as typeof sampleImages[0]).slug;
                const cat = isDb ? (img as CommunityImage).category : getCategorySlugForImage(img as typeof sampleImages[0]);
                const style = isDb ? (img as CommunityImage).style : undefined;
                const key = isDb ? (img as CommunityImage).id : (img as typeof sampleImages[0]).slug;

                return (
                  <ImageCard
                    key={key}
                    image={{ slug, title, url: src, category: cat, style }}
                    href={`/${cat}/${slug}`}
                  />
                );
              })}
            </ImageGrid>

            {/* Category pills */}
            {categories.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {categories.map((cat: DbCategory) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 sm:text-sm"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ───── ANIMATIONS ZONE ───── */}
      {animationItems.length > 0 && (
        <>
          <div className="relative z-10">
            <div className="h-24 bg-gradient-to-b from-white to-[#0a0a0a] sm:h-32" />
          </div>

          <div className="relative z-10 bg-[#0a0a0a]">
            <section className="py-16 sm:py-20">
              <div className="mx-auto max-w-6xl px-4">
                <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1">
                      <svg className="h-3 w-3 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                        New
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      Animated clip art
                    </h2>
                    <p className="mt-2 max-w-lg text-sm text-gray-400">
                      Bring your clip art to life with AI-powered animations.
                      Perfect for presentations, social media, and engaging classroom content.
                    </p>
                  </div>
                  <Link
                    href="/animations"
                    className="shrink-0 text-sm font-semibold text-purple-400 transition-colors hover:text-purple-300"
                  >
                    View all animations &rarr;
                  </Link>
                </div>

                <AnimationGrid animations={animationItems.map((a) => ({
                  id: a.id,
                  prompt: a.prompt,
                  videoUrl: a.videoUrl,
                  posterUrl: a.posterUrl,
                  style: a.style,
                  category: a.category,
                  slug: a.slug,
                  createdAt: "",
                }))} />

                <div className="mt-10 text-center">
                  <Link
                    href="/create"
                    className="btn-primary px-8 text-sm sm:text-base"
                  >
                    Create &amp; Animate Your Own
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="relative z-10">
            <div className="h-24 bg-gradient-to-b from-[#0a0a0a] to-white sm:h-32" />
          </div>
        </>
      )}

      {/* ───── WHITE ZONE (continued) ───── */}
      <div className="relative z-10 bg-white">

        {/* ── COLORING PAGES SHOWCASE ── */}
        <section className="border-t border-gray-100 bg-gray-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Coloring Pages</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Printable coloring pages with AI
                </h2>
              </div>
              <Link href="/create/coloring-pages" className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700">
                Create coloring pages &rarr;
              </Link>
            </div>

            {hasColoring ? (
              <ImageGrid variant="coloring" className="mt-8">
                {coloringImages.map((img) => (
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
            ) : (
              <div className="mt-8 rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
                <p className="text-lg font-semibold text-gray-400">Coloring pages are new!</p>
                <p className="mt-2 text-sm text-gray-400">Be the first to create one and see it featured here.</p>
                <Link href="/create/coloring-pages" className="btn-primary mt-6 inline-flex text-sm">
                  Create a Coloring Page
                </Link>
              </div>
            )}

            {/* Theme pills */}
            {activeThemes.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {activeThemes.map((theme: DbCategory) => (
                  <Link
                    key={theme.slug}
                    href={`/coloring-pages/${theme.slug}`}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 sm:text-sm"
                  >
                    {theme.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── WHAT YOU CAN DO ── */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                What you can do with{" "}
                <span className="gradient-text">clip.art</span>
              </h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-3xl border border-gray-200 bg-gray-200 md:grid-cols-3">
              <div className="bg-white p-8 sm:p-10">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50">
                  <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Teach &amp; Educate</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Custom worksheets, bulletin boards, coloring sheets, and visual aids for any lesson or season.
                </p>
              </div>

              <div className="bg-white p-8 sm:p-10">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Sell &amp; Monetize</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Unique designs for stickers, t-shirts, mugs, and POD merchandise — no designer needed.
                </p>
              </div>

              <div className="bg-white p-8 sm:p-10">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Play &amp; Create</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Coloring pages, birthday crafts, party decorations, and creative activities for the whole family.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEO CONTENT ── */}
        <section className="border-t border-gray-100 bg-gray-50/60 py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Free AI Clip Art &amp; Coloring Page Generator
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              clip.art is a free AI-powered clip art generator that turns text descriptions into
              beautiful, downloadable images in seconds. Whether you need flat vector-style clip art
              for a school project, watercolor illustrations for a greeting card, or cartoon designs
              for a t-shirt, our AI creates high-quality visuals from a simple text prompt. Every
              image is free for personal and commercial use with no attribution required.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
              Our AI coloring page generator creates printable coloring sheets with bold, clean outlines
              designed for easy coloring. Choose from popular themes like dinosaurs, unicorns, mandalas,
              mermaids, and farm animals — or describe any scene you can imagine. Each coloring page is
              generated in portrait format, optimized for printing on standard letter or A4 paper. Teachers
              use clip.art to create custom worksheets and classroom materials. Print-on-demand sellers
              use it to generate unique designs for merchandise. Parents and kids love it for creative
              activities and coloring fun.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <div className="divide-y divide-gray-200 rounded-3xl border border-gray-200">
              {faqItems.map((item, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left text-sm font-semibold text-gray-900 transition-colors hover:text-pink-600 sm:text-base [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <svg className="ml-4 h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-gray-500 sm:text-base">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="pb-20">
          <div className="mx-auto max-w-3xl px-4">
            <div className="rounded-3xl bg-brand-gradient p-[2px]">
              <div className="rounded-[22px] bg-white p-8 text-center sm:p-12">
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Ready to create something amazing?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                  10 free credits. No sign-up required. Describe what you want and download it instantly.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/create" className="btn-primary px-8 text-base">
                    Generate Clip Art
                  </Link>
                  <Link href="/create/coloring-pages" className="btn-secondary px-8 text-base">
                    Create Coloring Pages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </main>
  );
}
