import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Generator } from "@/components/Generator";
import { MosaicBackground } from "@/components/MosaicBackground";
import { getAllCategories, getColoringThemes, type DbCategory } from "@/lib/categories";
import { createSupabaseAdmin } from "@/lib/supabase/server";
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
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(12);
    return (data || []) as CommunityImage[];
  } catch {
    return [];
  }
}

const showcaseClipArt = sampleImages.slice(0, 3);

export default async function Home() {
  const [categories, coloringThemes, communityImages] = await Promise.all([
    getAllCategories(),
    getColoringThemes(),
    getCommunityGallery(),
  ]);

  const activeThemes = coloringThemes.filter((t) => t.slug !== "coloring-free");

  const galleryImages = communityImages.length > 0
    ? communityImages
    : null;

  return (
    <main className="relative bg-[#0a0a0a]">
      <MosaicBackground />

      {/* ───── DARK ZONE: Hero + Generator ───── */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Nav />

        <div className="flex flex-1 items-center justify-center px-4 py-6 pb-16">
          <div className="w-full max-w-xl">
            <div className="mb-6 text-center">
              <h1 className="font-futura-bold text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Generate Clip Art</span>
                <span className="gradient-text">In Seconds.</span>
              </h1>
              <p className="mt-4 whitespace-nowrap text-sm text-gray-300 sm:text-base">
                15 free generations. Describe it, download it, done.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400 sm:text-xs">
                  Step 01
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                  Describe
                </p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 sm:text-xs">
                  Step 02
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                  Generate
                </p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 sm:text-xs">
                  Step 03
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                  Download
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-[0_0_80px_rgba(255,138,101,0.15)] sm:p-8">
              <Generator />
            </div>
          </div>
        </div>
      </div>

      {/* ───── TRANSITION: Dark to White ───── */}
      <div className="relative z-10">
        <div className="h-32 bg-gradient-to-b from-[#0a0a0a] to-white sm:h-40" />
      </div>

      {/* ───── WHITE ZONE: Below the Fold ───── */}
      <div className="relative z-10 bg-white">

        {/* Section 1: Product Showcase */}
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What will you{" "}
              <span className="gradient-text">create?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
              From clip art to coloring pages — describe what you need and download it in seconds.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Clip Art Card */}
            <Link
              href="/create"
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-pink-200 hover:shadow-xl sm:p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50">
                <svg className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Clip Art</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Create stunning clip art in any style — flat, cartoon, watercolor, 3D, and more.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {showcaseClipArt.map((img) => (
                  <div key={img.slug} className="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      className="object-contain p-1.5 transition-transform group-hover:scale-105"
                      sizes="120px"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-pink-600 transition-colors group-hover:text-pink-700">
                  Start creating
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Coloring Pages Card */}
            <Link
              href="/create/coloring-pages"
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-xl sm:p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Coloring Pages</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Printable coloring pages with bold outlines — perfect for kids, classrooms, and relaxation.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-50">
                    <div className="flex h-full items-center justify-center">
                      <svg className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 transition-colors group-hover:text-orange-700">
                  Create coloring pages
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Animations Card (Coming Soon) */}
            <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                    Coming Soon
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-400">Animations</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  Bring your clip art to life with AI-powered animations and motion graphics.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-gray-100" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Community Gallery */}
        {galleryImages && galleryImages.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50/50 py-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  See what others are{" "}
                  <span className="gradient-text">creating</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
                  Fresh designs generated by the clip.art community.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {galleryImages.map((img) => {
                  const isColoring = img.style === "coloring";
                  const href = isColoring
                    ? `/coloring-pages/${img.category}/${img.slug || img.id}`
                    : `/${img.category}/${img.slug || img.id}`;

                  return (
                    <Link
                      key={img.id}
                      href={href}
                      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
                    >
                      <div className={`relative bg-gray-50 ${img.aspect_ratio === "3:4" ? "aspect-[3/4]" : "aspect-square"}`}>
                        <Image
                          src={img.image_url}
                          alt={`${img.title || img.prompt} — AI generated`}
                          fill
                          className="object-contain p-3 transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                          unoptimized
                        />
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-gray-600">
                          {img.title || img.prompt}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Section 2b: Static gallery fallback when no community images */}
        {(!galleryImages || galleryImages.length === 0) && (
          <section className="border-t border-gray-100 bg-gray-50/50 py-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  See what you can{" "}
                  <span className="gradient-text">create</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
                  High-quality clip art and illustrations, generated with AI in seconds.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {sampleImages.slice(0, 12).map((img) => {
                  const catSlug = getCategorySlugForImage(img);
                  return (
                    <Link
                      key={img.slug}
                      href={`/${catSlug}/${img.slug}`}
                      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
                    >
                      <div className="relative aspect-square bg-gray-50">
                        <Image
                          src={img.url}
                          alt={`${img.title} — free clip art`}
                          fill
                          className="object-contain p-3 transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                          unoptimized
                        />
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-gray-600">
                          {img.title}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Browse by Category */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Explore
              </h2>
            </div>

            {/* Clip Art Categories */}
            {categories.length > 0 && (
              <div className="mb-10">
                <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-gray-400">
                  Clip Art
                </h3>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {categories.map((cat: DbCategory) => (
                    <Link
                      key={cat.slug}
                      href={`/${cat.slug}`}
                      className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Coloring Page Themes */}
            {activeThemes.length > 0 && (
              <div>
                <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-gray-400">
                  Coloring Pages
                </h3>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {activeThemes.map((theme: DbCategory) => (
                    <Link
                      key={theme.slug}
                      href={`/coloring-pages/${theme.slug}`}
                      className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md"
                    >
                      {theme.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Use Cases */}
        <section className="border-t border-gray-100 bg-gray-50/50 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Built for{" "}
                <span className="gradient-text">creators</span>
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Teachers */}
              <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50">
                  <svg className="h-7 w-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Teachers &amp; Classrooms
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Custom worksheets, bulletin boards, and coloring sheets for every lesson and season.
                </p>
              </div>

              {/* Print on Demand */}
              <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                  <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Print on Demand
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Unique designs for stickers, t-shirts, mugs, and merchandise — no designer needed.
                </p>
              </div>

              {/* Parents & Kids */}
              <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Parents &amp; Kids
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Coloring pages, crafts, and creative activities for birthdays, rainy days, and family fun.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: SEO Content + Footer */}
        <section className="py-24">
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

        {/* Final CTA */}
        <section className="pb-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="rounded-3xl bg-brand-gradient p-[2px]">
              <div className="rounded-[22px] bg-white p-8 text-center sm:p-12">
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Ready to create something amazing?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                  15 free generations. No sign-up required. Describe what you want and download it instantly.
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

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-600">
              clip.art
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/coloring-pages" className="text-sm font-medium text-gray-400 hover:text-gray-600">
                Coloring Pages
              </Link>
              <Link href="/create" className="text-sm font-medium text-gray-400 hover:text-gray-600">
                AI Generator
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
