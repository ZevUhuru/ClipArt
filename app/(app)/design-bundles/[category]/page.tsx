import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PackGrid } from "@/components/packs/PackGrid";
import { buildCanonical, SITE_NAME } from "@/lib/seo";
import { buildBreadcrumbJsonLd, buildPackListJsonLd } from "@/lib/seo-jsonld";
import { ExploreTabs } from "@/components/ExploreTabs";

export const revalidate = 60;

interface Props {
  params: Promise<{ category: string }>;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  h1: string;
  meta_title: string | null;
  meta_description: string | null;
  intro: string | null;
}

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
  categories: { slug: string; name: string } | null;
}

async function getCategory(slug: string): Promise<CategoryRow | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("id, slug, name, h1, meta_title, meta_description, intro")
      .eq("slug", slug)
      .eq("type", "pack")
      .eq("is_active", true)
      .single();
    return data as CategoryRow | null;
  } catch {
    return null;
  }
}

async function getPacksByCategory(categoryId: string): Promise<PackRow[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(
        "id, title, slug, cover_image_url, item_count, content_types, formats, is_free, price_cents, downloads, categories!category_id(slug, name)",
      )
      .eq("category_id", categoryId)
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("downloads", { ascending: false })
      .limit(100);
    return (data || []) as PackRow[];
  } catch {
    return [];
  }
}

async function getAllPackCategories() {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("id, slug, name")
      .eq("type", "pack")
      .eq("is_active", true)
      .order("sort_order");
    return data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) return {};

  const title =
    category.meta_title ||
    `Free ${category.name} Clip Art Bundles & Design Bundles | clip.art`;
  const description =
    category.meta_description ||
    `Download free ${category.name.toLowerCase()} clip art bundles and design bundles. AI-generated themed collections in SVG and PNG.`;
  const canonical = buildCanonical(`design-bundles/${category.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PackCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) notFound();

  const [packs, allCategories] = await Promise.all([
    getPacksByCategory(category.id),
    getAllPackCategories(),
  ]);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "https://clip.art" },
    { name: "Bundles", path: "design-bundles" },
    { name: `${category.name} Bundles`, path: `design-bundles/${category.slug}` },
  ]);

  const listJsonLd = buildPackListJsonLd(
    packs.map((p) => ({
      title: p.title,
      categorySlug: p.categories?.slug || category.slug,
      slug: p.slug,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumb, listJsonLd]),
        }}
      />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-white to-orange-50/60" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-200/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-6 sm:pb-10 sm:pt-10">
            <div className="mb-6 flex justify-center">
              <ExploreTabs />
            </div>
            <div className="flex flex-col items-center text-center">
              {packs.length > 0 && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-pink-200/60 bg-white/80 px-3 py-1 text-xs font-semibold text-pink-600 shadow-sm backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  {packs.length} bundle{packs.length !== 1 ? "s" : ""}
                </span>
              )}

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                {category.name}{" "}
                <span className="gradient-text">Bundles</span>
              </h1>

              {category.intro && (
                <p className="mt-3 max-w-lg text-balance text-sm text-gray-500 sm:text-base">
                  {category.intro}
                </p>
              )}

              {/* Category pills */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/design-bundles"
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  All Bundles
                </Link>
                {allCategories.map((cat: { id: string; slug: string; name: string }) => (
                  <Link
                    key={cat.id}
                    href={`/design-bundles/${cat.slug}`}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      cat.slug === category.slug
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white">
                {category.name}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {packs.length} bundle{packs.length !== 1 ? "s" : ""}
            </p>
          </div>

          {packs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50">
                <svg className="h-8 w-8 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">No {category.name.toLowerCase()} bundles yet</h2>
              <p className="mt-1 max-w-xs text-sm text-gray-400">
                Be the first to create a {category.name.toLowerCase()} themed bundle.
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
        </div>
      </div>
    </>
  );
}
