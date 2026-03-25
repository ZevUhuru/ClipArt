import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getAllCategories, type DbCategory } from "@/lib/categories";
import { CategoryPage } from "@/components/CategoryPage";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

interface PageProps {
  params: { category: string };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};

  return {
    title: category.meta_title || `${category.name} Clip Art`,
    description: category.meta_description,
    openGraph: {
      title: category.meta_title || `${category.name} Clip Art`,
      description: category.meta_description || undefined,
      url: `https://clip.art/${category.slug}`,
      siteName: "clip.art",
      type: "website",
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
      aspect_ratio: row.aspect_ratio || "1:1",
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
      .eq("is_active", true);
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  const [dbImages, relatedCategories] = await Promise.all([
    getGalleryImages(params.category),
    getRelatedCategories(category.related_slugs || []),
  ]);

  return (
    <CategoryPage
      category={category}
      galleryImages={dbImages}
      relatedCategories={relatedCategories}
    />
  );
}
