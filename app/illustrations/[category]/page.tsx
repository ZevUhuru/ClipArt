import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getIllustrationCategoryBySlug, getIllustrationCategories, type DbCategory } from "@/lib/categories";
import { IllustrationCategoryPage } from "@/components/IllustrationCategoryPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildListingMetadata } from "@/lib/seo";

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

  return buildListingMetadata({
    title: category.meta_title,
    description: category.meta_description,
    categoryName: category.name,
    contentType: "illustration",
    path: `illustrations/${category.slug}`,
  });
}

async function getGalleryImages(categorySlug: string) {
  try {
    const admin = createSupabaseAdmin();
    const catPattern = `%${categorySlug.replace(/-/g, " ")}%`;
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at")
      .eq("content_type", "illustration")
      .eq("is_public", true)
      .or(
        `category.eq.${categorySlug},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
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
