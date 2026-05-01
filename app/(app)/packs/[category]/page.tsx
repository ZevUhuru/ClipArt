import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { AdminOnly } from "@/components/AdminOnly";
import { PackGrid } from "@/components/packs/PackGrid";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { buildBreadcrumbJsonLd, buildPackListJsonLd } from "@/lib/seo-jsonld";
import { getCharacterForPack } from "@/data/characters";

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
  tags?: string[];
  categories: { slug: string; name: string } | null;
}

const STATIC_CHARACTER_CATEGORY: CategoryRow = {
  id: "characters-static",
  slug: "characters",
  name: "Characters",
  h1: "Character Clip Art Packs",
  meta_title: "Character Clip Art Packs & Reference Sheet Bundles | clip.art",
  meta_description:
    "Browse character clip art packs, reference sheets, pose sets, expression packs, and themed character bundles from clip.art.",
  intro:
    "Character bundles collect reusable reference sheets, poses, expressions, outfits, props, and story-ready clip art under cohesive named identities.",
};

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
    return slug === "characters" ? STATIC_CHARACTER_CATEGORY : null;
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

async function getCharacterPacks(): Promise<PackRow[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(
        "id, title, slug, cover_image_url, item_count, content_types, formats, is_free, price_cents, downloads, tags, categories!category_id(slug, name)",
      )
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("downloads", { ascending: false })
      .limit(200);
    return ((data || []) as PackRow[])
      .filter((pack) => Boolean(getCharacterForPack(pack)))
      .map((pack) => ({
        ...pack,
        categories: { slug: STATIC_CHARACTER_CATEGORY.slug, name: STATIC_CHARACTER_CATEGORY.name },
      }));
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
    `Free ${category.name} Clip Art Packs & Creative Bundles | clip.art`;
  const description =
    category.meta_description ||
    `Download free ${category.name.toLowerCase()} clip art packs and creative bundles. AI-generated themed collections as transparent PNG assets.`;
  const canonical = buildCanonical(`packs/${category.slug}`);

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
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PackCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) notFound();

  const [packs, allCategories] = await Promise.all([
    category.id === STATIC_CHARACTER_CATEGORY.id ? getCharacterPacks() : getPacksByCategory(category.id),
    getAllPackCategories(),
  ]);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "https://clip.art" },
    { name: "Packs", path: "packs" },
    { name: `${category.name} Packs`, path: `packs/${category.slug}` },
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
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-white to-orange-50/60" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-200/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-8 sm:pb-10 sm:pt-12">
            <div className="flex flex-col items-center text-center">
              {packs.length > 0 && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-pink-200/60 bg-white/80 px-3 py-1 text-xs font-semibold text-pink-600 shadow-sm backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  {packs.length} pack{packs.length !== 1 ? "s" : ""}
                </span>
              )}

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                {category.name} <span className="gradient-text">Packs</span>
              </h1>

              {category.intro && (
                <p className="mt-3 max-w-lg text-balance text-sm text-gray-500 sm:text-base">
                  {category.intro}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#category-packs"
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-800"
                >
                  Browse {category.name} packs
                </Link>
                <AdminOnly>
                  <Link
                    href="/create/packs"
                    className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-white px-5 py-2.5 text-sm font-bold text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300"
                  >
                    Create a pack
                  </Link>
                </AdminOnly>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/packs"
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  All Packs
                </Link>
                {allCategories.map((cat: { id: string; slug: string; name: string }) => (
                  <Link
                    key={cat.id}
                    href={`/packs/${cat.slug}`}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      cat.slug === category.slug
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
                {!allCategories.some((cat: { slug: string }) => cat.slug === STATIC_CHARACTER_CATEGORY.slug) && (
                  <Link
                    href="/packs/characters"
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      category.slug === STATIC_CHARACTER_CATEGORY.slug
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Characters
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <div id="category-packs" className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="w-fit rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white">
              {category.name}
            </span>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-400">
                {packs.length} pack{packs.length !== 1 ? "s" : ""}
              </p>
              <AdminOnly>
                <Link
                  href="/create/packs"
                  className="rounded-full bg-brand-gradient px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110"
                >
                  Create a pack
                </Link>
              </AdminOnly>
            </div>
          </div>

          {packs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
              <h2 className="text-base font-bold text-gray-900">No {category.name.toLowerCase()} packs yet</h2>
              <p className="mt-1 max-w-xs text-sm text-gray-400">
                Be the first to create a {category.name.toLowerCase()} themed pack.
              </p>
              <AdminOnly>
                <Link
                  href="/create/packs"
                  className="mt-4 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                >
                  Create a pack
                </Link>
              </AdminOnly>
            </div>
          ) : (
            <PackGrid packs={packs} />
          )}
        </div>
      </div>
    </>
  );
}

