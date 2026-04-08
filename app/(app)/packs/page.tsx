import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PackGrid } from "@/components/packs/PackGrid";
import { buildCanonical, SITE_NAME } from "@/lib/seo";
import { buildPackListJsonLd } from "@/lib/seo-jsonld";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free Clip Art Bundles & Design Packs | clip.art",
  description:
    "Download free clip art bundles, coloring page packs, and illustration collections. AI-generated themed design packs in SVG and PNG — perfect for crafting, teaching, and creative projects.",
  openGraph: {
    title: "Free Clip Art Bundles & Design Packs | clip.art",
    description:
      "Download free clip art bundles and design packs. AI-generated themed collections for crafting, teaching, and design.",
    url: buildCanonical("packs"),
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Free Clip Art Bundles & Design Packs | clip.art",
    description:
      "Download free AI-generated clip art bundles and design packs.",
  },
  alternates: { canonical: buildCanonical("packs") },
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

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-white to-orange-50/60" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-200/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-8 sm:pb-10 sm:pt-14">
            <div className="flex flex-col items-center text-center">
              {packs.length > 0 && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-pink-200/60 bg-white/80 px-3 py-1 text-xs font-semibold text-pink-600 shadow-sm backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  {packs.length} pack{packs.length !== 1 ? "s" : ""}
                </span>
              )}

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Design{" "}
                <span className="gradient-text">Packs</span>
              </h1>

              <p className="mt-3 max-w-lg text-balance text-sm text-gray-500 sm:text-base">
                Curated bundles of clip art, coloring pages, and illustrations.
                Download themed collections in SVG and PNG.
              </p>

              {/* Category pills */}
              {categories.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/packs"
                    className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-gray-800"
                  >
                    All Packs
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/packs/${cat.slug}`}
                      className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Featured */}
          {featured.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">Featured</h2>
                <p className="text-xs text-gray-400">
                  {featured.length} pack{featured.length !== 1 ? "s" : ""}
                </p>
              </div>
              <PackGrid packs={featured} />
            </section>
          )}

          {/* All packs */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white">
                  All Packs
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {packs.length} pack{packs.length !== 1 ? "s" : ""}
              </p>
            </div>

            {packs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50">
                  <svg className="h-8 w-8 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">No packs yet</h2>
                <p className="mt-1 max-w-xs text-sm text-gray-400">
                  Be the first to create a themed bundle of clip art, coloring pages, and illustrations.
                </p>
                <Link
                  href="/create/packs"
                  className="mt-4 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                >
                  Create a Pack
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
