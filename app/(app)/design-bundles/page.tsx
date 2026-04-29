import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PackGrid } from "@/components/packs/PackGrid";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { buildPackListJsonLd } from "@/lib/seo-jsonld";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free Clip Art Bundles & Design Bundles | clip.art",
  description:
    "Download free clip art bundles, coloring page bundles, and illustration collections. AI-generated themed design bundles as transparent PNG assets — perfect for crafting, teaching, and creative projects.",
  openGraph: {
    title: "Free Clip Art Bundles & Design Bundles | clip.art",
    description:
      "Download free clip art bundles and design bundles. AI-generated themed collections for crafting, teaching, and design.",
    url: buildCanonical("design-bundles"),
    siteName: SITE_NAME,
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Clip Art Bundles & Design Bundles | clip.art",
    description:
      "Download free AI-generated clip art bundles and design bundles.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  alternates: { canonical: buildCanonical("design-bundles") },
  robots: { index: true, follow: true },
};

interface PackRow {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  item_count: number;
  content_types: string[];
  formats: string[];
  is_free: boolean;
  price_cents: number | null;
  downloads: number;
  is_featured: boolean;
  categories: { slug: string; name: string } | null;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

const SHOP_PROMISES = [
  "Curated by theme",
  "Commercial-friendly downloads",
  "Transparent PNG assets",
];

function formatStat(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

async function getPublishedPacks(): Promise<PackRow[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(
        "id, title, slug, cover_image_url, item_count, content_types, formats, is_free, price_cents, downloads, is_featured, categories!category_id(slug, name)",
      )
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("downloads", { ascending: false })
      .limit(100);
    return (data || []) as PackRow[];
  } catch {
    return [];
  }
}

async function getPackCategories(): Promise<CategoryRow[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("id, slug, name")
      .eq("type", "pack")
      .eq("is_active", true)
      .order("sort_order");
    return (data || []) as CategoryRow[];
  } catch {
    return [];
  }
}

export default async function PacksPage() {
  const [packs, categories] = await Promise.all([
    getPublishedPacks(),
    getPackCategories(),
  ]);

  const featured = packs.filter((p) => p.is_featured);
  const heroSource = featured.length > 0 ? featured : packs;
  const preferredHeroPack = heroSource.find((pack) =>
    pack.title.toLowerCase().includes("whimsical spring woman"),
  );
  const heroPacks = [
    ...(preferredHeroPack ? [preferredHeroPack] : []),
    ...heroSource.filter((pack) => pack.id !== preferredHeroPack?.id),
  ].slice(0, 3);
  const leadPack = heroPacks[0] || packs[0];
  const totalItems = packs.reduce((sum, pack) => sum + (pack.item_count || 0), 0);
  const freeCount = packs.filter((pack) => pack.is_free).length;

  const jsonLd = buildPackListJsonLd(
    packs.map((p) => ({
      title: p.title,
      categorySlug: p.categories?.slug || "all",
      slug: p.slug,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#f5f6f8]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/80 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(236,72,153,0.16),transparent_26%),radial-gradient(circle_at_86%_24%,rgba(251,146,60,0.18),transparent_28%),linear-gradient(135deg,#fff_0%,#fff7ed_48%,#fdf2f8_100%)]" />
          <div className="absolute left-1/2 top-0 h-px w-[80rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />

          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:pb-14 lg:pt-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-white/75 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-pink-600 shadow-sm backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_0_4px_rgba(236,72,153,0.12)]" />
                  Theme Pack Marketplace
                </span>

                <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                  Shop ready-made{" "}
                  <span className="bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                    creative bundles
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                  Browse themed packs of clip art, coloring pages, and illustrations built for classrooms,
                  craft shops, worksheets, invitations, social posts, and seasonal campaigns.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#bundle-collection"
                    className="inline-flex items-center justify-center rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-gray-950/15 transition-all hover:-translate-y-0.5 hover:bg-gray-800"
                  >
                    Browse bundles
                  </Link>
                  <Link
                    href="/create/packs"
                    className="inline-flex items-center justify-center rounded-2xl border border-pink-200 bg-white/85 px-5 py-3 text-sm font-black text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:bg-white"
                  >
                    Create Bundle
                  </Link>
                </div>

                <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 rounded-[1.5rem] border border-white/80 bg-white/70 p-2 shadow-sm ring-1 ring-gray-200/60 backdrop-blur">
                  <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
                    <p className="text-lg font-black text-gray-950">{formatStat(packs.length)}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Bundles</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
                    <p className="text-lg font-black text-gray-950">{formatStat(totalItems)}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Assets</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
                    <p className="text-lg font-black text-gray-950">{formatStat(freeCount)}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Free</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-pink-200/50 via-white/20 to-orange-200/50 blur-2xl" />
                <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-gray-950 p-3 shadow-2xl shadow-pink-200/50">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(244,114,182,0.28),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(251,146,60,0.22),transparent_28%)]" />
                  <div className="relative rounded-[1.75rem] bg-white p-3">
                    {leadPack?.cover_image_url ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-gray-100">
                        <Image
                          src={leadPack.cover_image_url}
                          alt={`${leadPack.title} bundle preview`}
                          fill
                          className="object-cover object-top"
                          priority
                          sizes="(max-width: 1024px) 100vw, 500px"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-pink-50 to-orange-50">
                        <svg className="h-16 w-16 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
                        </svg>
                      </div>
                    )}

                    <div className="mt-4 flex items-start justify-between gap-4 px-1">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-pink-500">
                          Featured drop
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-xl font-black tracking-tight text-gray-950">
                          {leadPack?.title || "Seasonal theme packs"}
                        </h2>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-950 px-3 py-1.5 text-xs font-black text-white">
                        {leadPack?.item_count || 0} items
                      </span>
                    </div>

                    {leadPack && (
                      <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                              Inside this pack
                            </p>
                            <p className="mt-1 text-xs font-bold text-gray-700">
                              A focused collection of spring woman artwork, floral details, and matching creative assets.
                            </p>
                          </div>
                          <Link
                            href={`/design-bundles/${leadPack.categories?.slug || "all"}/${leadPack.slug}`}
                            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-gray-900 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-pink-600"
                          >
                            View pack
                          </Link>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {leadPack.content_types.map((type) => (
                            <span
                              key={type}
                              className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-600 ring-1 ring-gray-200/70"
                            >
                              {type}
                            </span>
                          ))}
                          {leadPack.formats
                            .filter((format) => format.toLowerCase() !== "svg")
                            .map((format) => (
                            <span
                              key={format}
                              className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600"
                            >
                              {format.toUpperCase()}
                            </span>
                          ))}
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                            TRANSPARENT
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {SHOP_PROMISES.map((promise) => (
                <div key={promise} className="rounded-2xl border border-white/80 bg-white/65 px-4 py-3 text-sm font-bold text-gray-700 shadow-sm backdrop-blur">
                  {promise}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <div id="bundle-collection" className="mx-auto max-w-6xl px-4 py-10">
          {categories.length > 0 && (
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-sm ring-1 ring-gray-200/60">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                    Shop by theme
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                    Find the right collection faster
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-gray-500">
                  Jump into seasonal drops, classroom resources, wedding graphics, food sets, and more as inventory grows.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  href="/design-bundles"
                  className="rounded-full bg-gray-950 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-gray-800"
                >
                  All Bundles
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/design-bundles/${cat.slug}`}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-600 hover:shadow-sm"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <section className="mb-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                    Editor's picks
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                    Featured bundles
                  </h2>
                </div>
                <p className="text-xs font-bold text-gray-400">
                  {featured.length} bundle{featured.length !== 1 ? "s" : ""}
                </p>
              </div>
              <PackGrid packs={featured} />
            </section>
          )}

          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                  Full collection
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                  Browse all theme packs
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-gray-400">
                  {packs.length} bundle{packs.length !== 1 ? "s" : ""}
                </p>
                <Link
                  href="/create/packs"
                  className="rounded-full bg-brand-gradient px-4 py-2 text-xs font-black text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110"
                >
                  Create Bundle
                </Link>
              </div>
            </div>

            {packs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-gray-300 bg-white py-20 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50">
                  <svg className="h-8 w-8 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <h2 className="text-base font-black text-gray-900">No bundles yet</h2>
                <p className="mt-1 max-w-xs text-sm text-gray-400">
                  Be the first to create a themed bundle of clip art, coloring pages, and illustrations.
                </p>
                <Link
                  href="/create/packs"
                  className="mt-4 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                >
                  Create a Bundle
                </Link>
              </div>
            ) : (
              <PackGrid packs={packs} />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
