import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, categoryMap } from "@/data/categories";
import { CategoryPage } from "@/components/CategoryPage";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

interface PageProps {
  params: { category: string };
}

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const category = categoryMap.get(params.category);
  if (!category) return {};

  return {
    title: category.metaTitle,
    description: category.metaDescription,
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
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
      .select("id, prompt, title, image_url, style, category, created_at")
      .eq("category", categorySlug)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(60);

    return (data || []).map((row: Record<string, string>) => ({
      slug: row.id,
      title: row.title || row.prompt,
      url: row.image_url,
      description: row.prompt,
      category: row.category,
      tags: [row.style, row.category].filter(Boolean),
    }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const category = categoryMap.get(params.category);
  if (!category) notFound();

  const dbImages = await getGalleryImages(params.category);

  return <CategoryPage category={category} galleryImages={dbImages} />;
}
