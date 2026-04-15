import type { MetadataRoute } from "next";
import { sampleImages } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";
import { getAllCategories, getColoringThemes, getIllustrationCategories } from "@/lib/categories";
import { getAllPosts } from "@/lib/learn";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 3600;

async function getPublicImageSlugs(contentType?: string) {
  try {
    const admin = createSupabaseAdmin();
    let query = admin
      .from("generations")
      .select("slug, id, category, style, content_type, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (contentType) query = query.eq("content_type", contentType);
    else query = query.eq("content_type", "clipart");

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
  const illustrationImages = await getPublicImageSlugs("illustration");
  const coloringDetailPages: MetadataRoute.Sitemap = coloringImages.map(
    (row: { slug: string | null; id: string; category: string; created_at: string }) => ({
      url: `${baseUrl}/coloring-pages/${row.category}/${row.slug || row.id}`,
      lastModified: new Date(row.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  /* --- Illustrations --- */

  const illustrationsLanding: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/illustrations`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];

  const illustrationCats = await getIllustrationCategories();
  const illustrationCategoryPages: MetadataRoute.Sitemap = illustrationCats.map((cat) => ({
    url: `${baseUrl}/illustrations/${cat.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const illustrationDetailPages: MetadataRoute.Sitemap = illustrationImages.map(
    (row: { slug: string | null; id: string; category: string; created_at: string }) => ({
      url: `${baseUrl}/illustrations/${row.category}/${row.slug || row.id}`,
      lastModified: new Date(row.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  /* --- Packs --- */

  const packsLanding: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/design-bundles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];

  let packCategoryPages: MetadataRoute.Sitemap = [];
  let packDetailPages: MetadataRoute.Sitemap = [];
  try {
    const admin = createSupabaseAdmin();
    const { data: packCats } = await admin
      .from("categories")
      .select("slug")
      .eq("type", "pack")
      .eq("is_active", true);

    packCategoryPages = (packCats || []).map((cat: { slug: string }) => ({
      url: `${baseUrl}/design-bundles/${cat.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    const { data: packs } = await admin
      .from("packs")
      .select("slug, created_at, updated_at, categories!category_id(slug)")
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(2000);

    packDetailPages = (packs || []).map(
      (p: { slug: string; updated_at: string; categories?: { slug: string } | null }) => ({
        url: `${baseUrl}/design-bundles/${p.categories?.slug || "all"}/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  } catch {
    // packs table may not exist yet
  }

  /* --- Animations --- */

  const animationsLanding: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/animations`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  /* --- Stickers --- */

  const stickersLanding: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/stickers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  /* --- Animals hub --- */

  const animalsHub: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/animals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];

  /* --- Hub pages --- */

  const hubPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/create`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/animate`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/edit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  /* --- Learn --- */

  const learnHub: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const learnPosts = getAllPosts();
  const learnArticlePages: MetadataRoute.Sitemap = learnPosts.map((post) => ({
    url: `${baseUrl}/learn/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...samplePages,
    ...dbImagePages,
    ...coloringLanding,
    ...coloringThemePages,
    ...coloringDetailPages,
    ...illustrationsLanding,
    ...illustrationCategoryPages,
    ...illustrationDetailPages,
    ...packsLanding,
    ...packCategoryPages,
    ...packDetailPages,
    ...animationsLanding,
    ...stickersLanding,
    ...animalsHub,
    ...hubPages,
    ...learnHub,
    ...learnArticlePages,
  ];
}
