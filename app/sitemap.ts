import type { MetadataRoute } from "next";
import { sampleImages } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";
import { getAllCategories, getColoringThemes } from "@/lib/categories";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 3600;

async function getPublicImageSlugs(style?: string) {
  try {
    const admin = createSupabaseAdmin();
    let query = admin
      .from("generations")
      .select("slug, id, category, style, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (style) query = query.eq("style", style);
    else query = query.neq("style", "coloring");

    const { data } = await query;
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

  /* --- Clip art --- */

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

  /* --- Coloring pages --- */

  const coloringLanding: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/coloring-pages`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];

  const coloringThemes = await getColoringThemes();
  const coloringThemePages: MetadataRoute.Sitemap = coloringThemes.map((t) => ({
    url: `${baseUrl}/coloring-pages/${t.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const coloringImages = await getPublicImageSlugs("coloring");
  const coloringDetailPages: MetadataRoute.Sitemap = coloringImages.map(
    (row: { slug: string | null; id: string; category: string; created_at: string }) => ({
      url: `${baseUrl}/coloring-pages/${row.category}/${row.slug || row.id}`,
      lastModified: new Date(row.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [
    ...staticPages,
    ...categoryPages,
    ...samplePages,
    ...dbImagePages,
    ...coloringLanding,
    ...coloringThemePages,
    ...coloringDetailPages,
  ];
}
