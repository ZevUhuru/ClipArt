import type { MetadataRoute } from "next";
import { sampleImages } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";
import { getAllCategories } from "@/lib/categories";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 3600;

async function getPublicImageSlugs() {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("slug, id, category, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5000);
    return data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://clip.art";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  const dbCategories = await getAllCategories();
  const categoryPages: MetadataRoute.Sitemap = dbCategories.map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const samplePages: MetadataRoute.Sitemap = sampleImages.map((img) => {
    const categorySlug = getCategorySlugForImage(img);
    return {
      url: `${baseUrl}/${categorySlug}/${img.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  const dbImages = await getPublicImageSlugs();
  const dbImagePages: MetadataRoute.Sitemap = dbImages.map(
    (row: { slug: string | null; id: string; category: string; created_at: string }) => ({
      url: `${baseUrl}/${row.category}/${row.slug || row.id}`,
      lastModified: new Date(row.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [...staticPages, ...categoryPages, ...samplePages, ...dbImagePages];
}
