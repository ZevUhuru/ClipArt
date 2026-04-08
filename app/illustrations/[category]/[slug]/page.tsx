import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getIllustrationCategoryBySlug } from "@/lib/categories";
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
  return [];
}

async function getDbImage(slug: string) {
  try {
    const admin = createSupabaseAdmin();

    const { data: bySlug } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, description, aspect_ratio, created_at")
      .eq("slug", slug)
      .eq("content_type", "illustration")
      .eq("is_public", true)
      .single();

    if (bySlug) return bySlug;

    const { data: byId } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, description, aspect_ratio, created_at")
      .eq("id", slug)
      .eq("content_type", "illustration")
      .eq("is_public", true)
      .single();

    return byId || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dbImage = await getDbImage(params.slug);
  if (!dbImage) return {};

  const canonicalSlug = dbImage.slug || dbImage.id;
  const canonicalCategory = dbImage.category || params.category;
  const category = await getIllustrationCategoryBySlug(canonicalCategory);
  const categoryName = category?.name || canonicalCategory;
  const imageTitle = dbImage.title || dbImage.prompt;
  const imageDesc = dbImage.description || dbImage.prompt;

  return buildPageMetadata({
    subject: imageTitle,
    description: imageDesc,
    contentType: "illustration",
    categoryName,
    path: `illustrations/${canonicalCategory}/${canonicalSlug}`,
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
      .eq("content_type", "illustration")
      .eq("is_public", true)
      .or(
        `category.eq.${category},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
      .neq("slug", excludeSlug)
      .order("created_at", { ascending: false })
      .limit(8);

    return (data || []).map((r: { title: string; slug: string; category: string; image_url: string; aspect_ratio: string }) => ({
      title: r.title || "Illustration",
      slug: r.slug,
      category: r.category,
      url: r.image_url,
      aspect_ratio: r.aspect_ratio || "4:3",
    }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const dbRow = await getDbImage(params.slug);
  if (!dbRow) notFound();

  const canonicalSlug = dbRow.slug || dbRow.id;
  const canonicalCategory = dbRow.category || params.category;

  if (params.category !== canonicalCategory || params.slug !== canonicalSlug) {
    permanentRedirect(`/illustrations/${canonicalCategory}/${canonicalSlug}`);
  }

  const image = {
    title: dbRow.title || dbRow.prompt,
    slug: canonicalSlug,
    category: canonicalCategory,
    url: dbRow.image_url,
    description: dbRow.description || dbRow.prompt,
    tags: [dbRow.style, dbRow.category].filter(Boolean) as string[],
    aspect_ratio: dbRow.aspect_ratio || "4:3",
    prompt: dbRow.prompt,
  };

  const relatedImages = await getRelatedImages(canonicalCategory, canonicalSlug);

  const category = await getIllustrationCategoryBySlug(canonicalCategory);
  const categoryName = category?.name || canonicalCategory;

  return (
    <>
      <ImageDetailPage
        image={image}
        categorySlug={canonicalCategory}
        contentType="illustration"
        relatedImages={relatedImages}
        categoryName={categoryName}
        imageId={dbRow.id}
      />
      <MarketingFooter />
    </>
  );
}
