import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getColoringThemeBySlug, getColoringThemes, type DbCategory } from "@/lib/categories";
import { ColoringThemePage } from "@/components/ColoringThemePage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 60;

interface PageProps {
  params: { theme: string };
}

export async function generateStaticParams() {
  const themes = await getColoringThemes();
  return themes.map((t) => ({ theme: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const theme = await getColoringThemeBySlug(params.theme);
  if (!theme) return {};

  return buildListingMetadata({
    title: theme.meta_title,
    description: theme.meta_description,
    categoryName: theme.name,
    contentType: "coloring",
    path: `coloring-pages/${theme.slug}`,
  });
}

async function getGalleryImages(themeSlug: string) {
  try {
    const admin = createSupabaseAdmin();
    const catPattern = `%${themeSlug.replace(/-/g, " ")}%`;
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at")
      .eq("content_type", "coloring")
      .eq("is_public", true)
      .or(
        `category.eq.${themeSlug},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
      .order("created_at", { ascending: false })
      .limit(60);

    return (data || []).map((row: Record<string, string>) => ({
      slug: row.slug || row.id,
      title: row.title || row.prompt,
      url: row.image_url,
      description: row.prompt,
      category: row.category,
      tags: ["coloring", row.category].filter(Boolean),
      aspect_ratio: row.aspect_ratio || "3:4",
    }));
  } catch {
    return [];
  }
}

async function getRelatedThemes(relatedSlugs: string[]): Promise<DbCategory[]> {
  if (!relatedSlugs.length) return [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .in("slug", relatedSlugs)
      .eq("type", "coloring")
      .eq("is_active", true);
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const theme = await getColoringThemeBySlug(params.theme);
  if (!theme) notFound();

  const [dbImages, relatedThemes] = await Promise.all([
    getGalleryImages(params.theme),
    getRelatedThemes(theme.related_slugs || []),
  ]);

  return (
    <>
      <ColoringThemePage
        theme={theme}
        galleryImages={dbImages}
        relatedThemes={relatedThemes}
      />
      <MarketingFooter />
    </>
  );
}
