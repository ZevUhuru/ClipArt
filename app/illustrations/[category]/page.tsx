import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getIllustrationCategoryBySlug, getIllustrationCategories, type DbCategory } from "@/lib/categories";
import { IllustrationCategoryPage } from "@/components/IllustrationCategoryPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

interface PageProps {
  params: { category: string };
}

export async function generateStaticParams() {
  const categories = await getIllustrationCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getIllustrationCategoryBySlug(params.category);
  if (!category) return {};

  const title = category.meta_title || `${category.name} Illustrations — Free AI Illustrations`;
  const description = category.meta_description || `Free ${category.name.toLowerCase()} illustrations. Create and download AI-generated ${category.name.toLowerCase()} illustrations with detailed backgrounds.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://clip.art/illustrations/${category.slug}`,
      siteName: "clip.art",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `https://clip.art/illustrations/${category.slug}`,
    },
  };
}

async function getGalleryImages(categorySlug: string) {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at")
      .eq("category", categorySlug)
      .eq("content_type", "illustration")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(60);

    return (data || []).map((row: Record<string, string>) => ({
      slug: row.slug || row.id,
      title: row.title || row.prompt,
      url: row.image_url,
      description: row.prompt,
      category: row.category,
      tags: [row.style, row.category].filter(Boolean),
      aspect_ratio: row.aspect_ratio || "4:3",
    }));
  } catch {
    return [];
  }
}

async function getRelatedCategories(relatedSlugs: string[]): Promise<DbCategory[]> {
  if (!relatedSlugs.length) return [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .in("slug", relatedSlugs)
      .eq("type", "illustration")
      .eq("is_active", true);
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const category = await getIllustrationCategoryBySlug(params.category);
  if (!category) notFound();

  const [dbImages, relatedCategories] = await Promise.all([
    getGalleryImages(params.category),
    getRelatedCategories(category.related_slugs || []),
  ]);

  return (
    <>
      <IllustrationCategoryPage
        category={category}
        galleryImages={dbImages}
        relatedCategories={relatedCategories}
      />
      <MarketingFooter />
    </>
  );
}
