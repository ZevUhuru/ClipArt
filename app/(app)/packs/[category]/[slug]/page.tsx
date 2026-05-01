import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildCanonical, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from "@/lib/seo";
import { buildPackJsonLd, buildPackBreadcrumb } from "@/lib/seo-jsonld";
import { PackGrid } from "@/components/packs/PackGrid";
import { PackDownloadButton } from "@/components/packs/PackDownloadButton";
import { PackItemsDrawerGrid } from "@/components/packs/PackItemsDrawerGrid";
import { getCharacterForPack } from "@/data/characters";
import { getPackArtworkForPack } from "@/data/packArtwork";

export const revalidate = 60;
export const dynamicParams = true;

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

interface PackDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  audience: string | null;
  pack_goal: string | null;
  long_description: string | null;
  whats_included: string | null;
  use_cases: string | null;
  license_summary: string | null;
  compare_at_price_cents: number | null;
  launch_price_cents: number | null;
  launch_ends_at: string | null;
  cover_image_url: string | null;
  item_count: number;
  content_types: string[];
  formats: string[];
  tags: string[];
  is_free: boolean;
  price_cents: number | null;
  downloads: number;
  zip_url: string | null;
  zip_status: string;
  visibility: string;
  is_published: boolean;
  created_at: string;
  categories: { slug: string; name: string } | null;
  pack_items: {
    id: string;
    generation_id: string;
    is_exclusive: boolean;
    sort_order: number;
    generations: {
      id: string;
      title: string | null;
      slug: string | null;
      prompt: string;
      image_url: string;
      transparent_image_url: string | null;
      has_transparency: boolean | null;
      style: string;
      content_type: string;
      category: string | null;
      aspect_ratio: string | null;
      model: string | null;
    };
  }[];
}

interface RelatedPack {
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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  clipart: "clip art",
  coloring: "coloring pages",
  illustration: "illustrations",
};

async function getPack(slug: string): Promise<PackDetail | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(`
        id, title, slug, description, audience, pack_goal, long_description, whats_included,
        use_cases, license_summary, compare_at_price_cents, launch_price_cents, launch_ends_at,
        cover_image_url, item_count, content_types, formats, tags,
        is_free, price_cents, downloads, zip_url, zip_status, visibility, is_published, created_at,
        categories!category_id(slug, name),
        pack_items(
          id, generation_id, is_exclusive, sort_order,
          generations(id, title, slug, prompt, image_url, transparent_image_url, has_transparency, style, content_type, category, aspect_ratio, model)
        )
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .eq("visibility", "public")
      .single();

    return data as PackDetail | null;
  } catch {
    return null;
  }
}

async function getRelatedPacks(
  categoryId: string | undefined,
  currentPackId: string,
): Promise<RelatedPack[]> {
  if (!categoryId) return [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("packs")
      .select(
        "id, title, slug, cover_image_url, item_count, content_types, formats, is_free, price_cents, downloads, categories!category_id(slug, name)",
      )
      .eq("is_published", true)
      .eq("visibility", "public")
      .eq("category_id", categoryId)
      .neq("id", currentPackId)
      .order("downloads", { ascending: false })
      .limit(4);
    return (data || []) as RelatedPack[];
  } catch {
    return [];
  }
}

function getActivePackPrice(pack: Pick<PackDetail, "price_cents" | "launch_price_cents" | "launch_ends_at">) {
  if (pack.launch_price_cents && pack.launch_price_cents > 0) {
    if (!pack.launch_ends_at || new Date(pack.launch_ends_at).getTime() > Date.now()) {
      return pack.launch_price_cents;
    }
  }

  return pack.price_cents;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category: categorySlug } = await params;
  const pack = await getPack(slug);
  if (!pack) return {};

  const character = getCharacterForPack(pack);
  const routeCategorySlug =
    character && categorySlug === character.primaryCategorySlug
      ? character.primaryCategorySlug
      : pack.categories?.slug || "all";
  const categoryName =
    character && routeCategorySlug === character.primaryCategorySlug
      ? "Characters"
      : pack.categories?.name || "Design";
  const itemLabel = pack.content_types.map((ct) => CONTENT_TYPE_LABELS[ct] || ct).join(", ");
  const titleStr = `${pack.title} - ${pack.item_count} Free ${categoryName} ${itemLabel.includes(",") ? "Assets" : itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`;
  const title = titleStr.length > 60 ? `${titleStr.slice(0, 57)}...` : titleStr;
  const description =
    pack.description ||
    `Download ${pack.title} - ${pack.item_count} free AI-generated ${itemLabel} as transparent PNG assets. Free for personal and commercial use.`;
  const canonical = buildCanonical(`packs/${routeCategorySlug}/${pack.slug}`);
  const socialImage = pack.cover_image_url
    ? { url: pack.cover_image_url, alt: pack.title }
    : DEFAULT_SOCIAL_IMAGE;

  return {
    title: `${title} | clip.art`,
    description: description.length > 160 ? `${description.slice(0, 157)}...` : description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "article",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PackDetailPage({ params }: Props) {
  const { slug, category: categorySlug } = await params;
  const pack = await getPack(slug);
  if (!pack) notFound();

  const character = getCharacterForPack(pack);
  const catSlug = pack.categories?.slug || "all";
  const routeCatSlug =
    character && categorySlug === character.primaryCategorySlug
      ? character.primaryCategorySlug
      : catSlug;
  const routeCategoryName =
    character && routeCatSlug === character.primaryCategorySlug
      ? "Characters"
      : pack.categories?.name || "All";
  const referenceSheet = character?.referenceSheets[0];
  const items = [...(pack.pack_items || [])].sort((a, b) => a.sort_order - b.sort_order);
  const previewCount = pack.is_free ? items.length : Math.min(6, items.length);
  const hiddenCount = items.length - previewCount;
  const activePriceCents = getActivePackPrice(pack);

  let categoryIdForRelated: string | undefined;
  if (pack.categories) {
    try {
      const admin = createSupabaseAdmin();
      const { data } = await admin
        .from("categories")
        .select("id")
        .eq("slug", pack.categories.slug)
        .eq("type", "pack")
        .single();
      categoryIdForRelated = data?.id;
    } catch {}
  }

  const relatedPacks = await getRelatedPacks(categoryIdForRelated, pack.id);
  const packJsonLd = buildPackJsonLd({
    title: pack.title,
    description: pack.description || "",
    coverUrl: pack.cover_image_url || undefined,
    itemCount: pack.item_count,
    isFree: pack.is_free,
    priceCents: pack.price_cents,
    categorySlug: routeCatSlug,
    slug: pack.slug,
    tags: pack.tags,
    downloads: pack.downloads,
  });
  const breadcrumbJsonLd = buildPackBreadcrumb({
    categorySlug: routeCatSlug,
    categoryName: routeCategoryName,
    packTitle: pack.title,
    packSlug: pack.slug,
  });
  const contentSummary = pack.content_types
    .map((ct) => {
      const count = items.filter((i) => i.generations.content_type === ct).length;
      return `${count} ${CONTENT_TYPE_LABELS[ct] || ct}`;
    })
    .join(", ");
  const packArtwork = getPackArtworkForPack(pack);
  const heroImageUrl = packArtwork?.imageUrl || pack.cover_image_url;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([packJsonLd, breadcrumbJsonLd]),
        }}
      />

      <div className="min-h-screen">
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-white" />

          <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-6 sm:pb-10 sm:pt-10">
            <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/" className="transition-colors hover:text-gray-600">Home</Link>
              <span className="text-gray-300">/</span>
              <Link href="/packs" className="transition-colors hover:text-gray-600">Packs</Link>
              {routeCatSlug !== "all" && (
                <>
                  <span className="text-gray-300">/</span>
                  <Link
                    href={`/packs/${routeCatSlug}`}
                    className="transition-colors hover:text-gray-600"
                  >
                    {routeCategoryName}
                  </Link>
                </>
              )}
            </nav>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {packArtwork ? (
                <div className="hover-pack-twitch relative mx-auto aspect-[2/3] w-full max-w-[420px] drop-shadow-[0_30px_34px_rgba(15,23,42,0.34)] lg:mx-0 lg:w-[360px] lg:shrink-0">
                  <div className="pointer-events-none absolute inset-x-5 bottom-10 h-20 rounded-full bg-gray-950/24 blur-3xl" />
                  <div className="pointer-events-none absolute inset-x-10 top-8 h-64 rounded-full bg-gray-950/8 blur-3xl" />
                  <Image
                    src={packArtwork.imageUrl}
                    alt={packArtwork.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 80vw, 360px"
                    priority
                  />
                </div>
              ) : (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-lg lg:w-[440px] lg:shrink-0">
                  {heroImageUrl ? (
                    <Image
                      src={heroImageUrl}
                      alt={pack.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 440px"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg className="h-20 w-20 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    {pack.is_free ? (
                      <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                        Free
                      </span>
                    ) : (
                      <span className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        ${((activePriceCents || 0) / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {pack.title}
                </h1>

                {routeCatSlug !== categorySlug && categorySlug !== "all" && (
                  <p className="mt-2 text-xs text-gray-400">
                    This pack now lives in <Link href={`/packs/${routeCatSlug}/${pack.slug}`} className="font-semibold text-pink-600">/{routeCatSlug}</Link>.
                  </p>
                )}

                {pack.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
                    {pack.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                    {pack.item_count} items
                  </span>
                  {pack.formats
                    .filter((f) => f.toLowerCase() !== "svg")
                    .map((f) => (
                      <span key={f} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        {f.toUpperCase()}
                      </span>
                    ))}
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Transparent
                  </span>
                  {pack.downloads > 0 && (
                    <span className="text-xs text-gray-400">
                      {pack.downloads.toLocaleString()} downloads
                    </span>
                  )}
                </div>

                <div className="mt-5 rounded-xl border border-gray-100 bg-white/80 p-4 backdrop-blur-sm">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    What&apos;s included
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-600">
                    {pack.whats_included || `${contentSummary} - delivered as transparent PNG assets`}
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {pack.license_summary || "Free for personal and commercial use. No attribution required."}
                  </p>
                </div>

                {character && referenceSheet && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-pink-100 bg-white/85 p-4 backdrop-blur-sm">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={referenceSheet.imageUrl}
                          alt={referenceSheet.alt}
                          fill
                          className="object-contain"
                          sizes="80px"
                        />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wide text-pink-500">
                          Character reference sheet
                        </h2>
                        <p className="mt-1 text-sm font-bold text-gray-900">{character.name}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {referenceSheet.description}
                        </p>
                        <Link
                          href={`/characters/${character.slug}`}
                          className="mt-2 inline-flex text-xs font-bold text-pink-600 transition-colors hover:text-pink-500"
                        >
                          View {character.name} page
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <PackDownloadButton
                    packId={pack.id}
                    isFree={pack.is_free}
                    priceCents={activePriceCents}
                    zipReady={pack.zip_status === "ready"}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {(pack.long_description || pack.use_cases || pack.audience || pack.pack_goal) && (
          <section className="border-b border-gray-100 bg-white">
            <div className="mx-auto grid max-w-5xl gap-5 px-4 py-8 lg:grid-cols-[1.35fr_0.65fr]">
              {pack.long_description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
                    About this pack
                  </p>
                  <div className="mt-3 space-y-4 text-sm leading-7 text-gray-600">
                    {pack.long_description.split("\n").filter(Boolean).map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {(pack.audience || pack.pack_goal) && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h2 className="text-sm font-bold text-gray-900">Best for</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pack.audience && (
                        <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                          {pack.audience}
                        </span>
                      )}
                      {pack.pack_goal && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                          {pack.pack_goal}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {pack.use_cases && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h2 className="text-sm font-bold text-gray-900">Use cases</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{pack.use_cases}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Items in this pack</h2>
            <p className="text-xs text-gray-400">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>

          <PackItemsDrawerGrid items={items.slice(0, previewCount)} hiddenCount={hiddenCount} />
        </div>

        {pack.tags.length > 0 && (
          <div className="mx-auto max-w-5xl px-4 pb-8">
            <div className="flex flex-wrap gap-2">
              {pack.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gray-100 bg-white px-3 py-1 text-xs text-gray-500 transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedPacks.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="mx-auto max-w-5xl px-4 py-8">
              <h2 className="mb-6 text-sm font-bold text-gray-800">You might also like</h2>
              <PackGrid packs={relatedPacks} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

