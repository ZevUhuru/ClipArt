import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { sampleImages, imageBySlug } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";
import { getCategoryBySlug } from "@/lib/categories";
import { ImageDetailPage } from "@/components/ImageDetailPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: { category: string; slug: string };
}

export function generateStaticParams() {
  return sampleImages.map((img) => ({
    category: getCategorySlugForImage(img),
    slug: img.slug,
  }));
}

async function getDbImage(slug: string) {
  try {
    const admin = createSupabaseAdmin();

    const { data: bySlug } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, transparent_image_url, style, category, slug, description, aspect_ratio, created_at, has_transparency")
      .eq("slug", slug)
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .single();

    if (bySlug) return bySlug;

    const { data: byId } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, transparent_image_url, style, category, slug, description, aspect_ratio, created_at, has_transparency")
      .eq("id", slug)
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .single();

    return byId || null;
  } catch {
    return null;
  }
}

function getCanonicalSlug(dbRow: { slug: string | null; id: string }) {
  return dbRow.slug || dbRow.id;
}

function getCanonicalCategory(dbRow: { category: string | null }, fallback: string) {
  return dbRow.category || fallback;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const staticImage = imageBySlug.get(params.slug);

  if (staticImage) {
    const expectedCategory = getCategorySlugForImage(staticImage);
    if (params.category !== expectedCategory) return {};

    const category = await getCategoryBySlug(params.category);
    const categoryName = category?.name || params.category;
    return buildPageMetadata({
      subject: staticImage.title,
      description: staticImage.description,
      contentType: "clipart",
      categoryName,
      path: `${params.category}/${params.slug}`,
      image: { url: staticImage.url, alt: staticImage.title },
    });
  }

  const dbImage = await getDbImage(params.slug);
  if (!dbImage) return {};

  const canonicalSlug = getCanonicalSlug(dbImage);
  const canonicalCategory = getCanonicalCategory(dbImage, params.category);
  const category = await getCategoryBySlug(canonicalCategory);
  const categoryName = category?.name || canonicalCategory;
  const imageTitle = dbImage.title || dbImage.prompt;
  const imageDesc = dbImage.description || dbImage.prompt;

  return buildPageMetadata({
    subject: imageTitle,
    description: imageDesc,
    contentType: "clipart",
    categoryName,
    path: `${canonicalCategory}/${canonicalSlug}`,
    image: { url: dbImage.image_url, alt: imageTitle },
  });
}

async function getRelatedImages(category: string, excludeSlug: string) {
  try {
    const admin = createSupabaseAdmin();
    const catPattern = `%${category.replace(/-/g, " ")}%`;
    const { data } = await admin
      .from("generations")
      .select("title, slug, category, image_url, aspect_ratio")
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .or(
        `category.eq.${category},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
      .neq("slug", excludeSlug)
      .order("created_at", { ascending: false })
      .limit(8);

    return (data || []).map((r: { title: string; slug: string; category: string; image_url: string; aspect_ratio: string }) => ({
      title: r.title || "Clip art",
      slug: r.slug,
      category: r.category,
      url: r.image_url,
      aspect_ratio: r.aspect_ratio || "1:1",
    }));
  } catch {
    return [];
  }
}

async function getStyleRelatedImages(style: string | null, excludeSlug: string) {
  if (!style) return [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("title, slug, category, image_url")
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .eq("style", style)
      .neq("slug", excludeSlug)
      .order("created_at", { ascending: false })
      .limit(6);

    return (data || []).map((r: { title: string; slug: string; category: string; image_url: string }) => ({
      title: r.title || "Clip art",
      slug: r.slug,
      category: r.category,
      url: r.image_url,
    }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const staticImage = imageBySlug.get(params.slug);

  if (staticImage) {
    const expectedCategory = getCategorySlugForImage(staticImage);
    if (params.category !== expectedCategory) {
      permanentRedirect(`/${expectedCategory}/${params.slug}`);
    }
    return (
      <>
        <ImageDetailPage image={staticImage} categorySlug={params.category} />
        <MarketingFooter />
      </>
    );
  }

  const dbRow = await getDbImage(params.slug);
  if (!dbRow) notFound();

  const canonicalSlug = getCanonicalSlug(dbRow);
  const canonicalCategory = getCanonicalCategory(dbRow, params.category);

  if (params.category !== canonicalCategory || params.slug !== canonicalSlug) {
    permanentRedirect(`/${canonicalCategory}/${canonicalSlug}`);
  }

  const image = {
    title: dbRow.title || dbRow.prompt,
    slug: canonicalSlug,
    category: canonicalCategory,
    url: dbRow.image_url,
    transparent_url: dbRow.transparent_image_url ?? undefined,
    description: dbRow.description || dbRow.prompt,
    tags: [dbRow.style, dbRow.category].filter(Boolean) as string[],
    aspect_ratio: dbRow.aspect_ratio || "1:1",
    prompt: dbRow.prompt,
    created_at: dbRow.created_at,
    has_transparency: dbRow.has_transparency ?? false,
  };

  const category = await getCategoryBySlug(canonicalCategory);
  const categorySeoContent = category?.seo_content
    ? (Array.isArray(category.seo_content)
        ? category.seo_content as string[]
        : [String(category.seo_content)])
    : [];

  const [relatedImages, styleRelatedImages] = await Promise.all([
    getRelatedImages(canonicalCategory, canonicalSlug),
    getStyleRelatedImages(dbRow.style, canonicalSlug),
  ]);

  return (
    <>
      <ImageDetailPage
        image={image}
        categorySlug={canonicalCategory}
        relatedImages={relatedImages}
        styleRelatedImages={styleRelatedImages}
        categorySeoContent={categorySeoContent}
        categoryName={category?.name}
        imageId={dbRow.id}
      />
      <MarketingFooter />
    </>
  );
}
