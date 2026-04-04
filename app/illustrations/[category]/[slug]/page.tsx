import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getIllustrationCategoryBySlug } from "@/lib/categories";
import { ImageDetailPage } from "@/components/ImageDetailPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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

  const category = await getIllustrationCategoryBySlug(params.category);
  const categoryName = category?.name || params.category;
  const imageTitle = dbImage.title || dbImage.prompt;
  const imageDesc = dbImage.description || dbImage.prompt;
  const title = `${imageTitle} — Free ${categoryName} Illustration | clip.art`;

  return {
    title,
    description: imageDesc,
    openGraph: {
      title,
      description: imageDesc,
      url: `https://clip.art/illustrations/${params.category}/${dbImage.slug || dbImage.id}`,
      siteName: "clip.art",
      type: "article",
      images: [{ url: dbImage.image_url, alt: imageTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: imageDesc,
      images: [dbImage.image_url],
    },
    alternates: {
      canonical: `https://clip.art/illustrations/${params.category}/${dbImage.slug || dbImage.id}`,
    },
  };
}

async function getRelatedImages(category: string, excludeSlug: string) {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("title, slug, category, image_url, aspect_ratio")
      .eq("content_type", "illustration")
      .eq("category", category)
      .eq("is_public", true)
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

  const image = {
    title: dbRow.title || dbRow.prompt,
    slug: dbRow.slug || dbRow.id,
    category: dbRow.category || params.category,
    url: dbRow.image_url,
    description: dbRow.description || dbRow.prompt,
    tags: [dbRow.style, dbRow.category].filter(Boolean) as string[],
    aspect_ratio: dbRow.aspect_ratio || "4:3",
  };

  const relatedImages = await getRelatedImages(
    dbRow.category || params.category,
    dbRow.slug || dbRow.id,
  );

  const category = await getIllustrationCategoryBySlug(params.category);
  const categoryName = category?.name || params.category;

  return (
    <>
      <ImageDetailPage
        image={image}
        categorySlug={params.category}
        relatedImages={relatedImages}
        categoryName={categoryName}
        imageId={dbRow.id}
      />
      <MarketingFooter />
    </>
  );
}
