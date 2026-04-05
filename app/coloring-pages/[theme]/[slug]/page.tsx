import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getColoringThemeBySlug } from "@/lib/categories";
import { ImageDetailPage } from "@/components/ImageDetailPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildPageMetadata } from "@/lib/seo";

function humanizeSlug(slug: string): string {
  return slug
    .replace(/^coloring-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Free";
}

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: { theme: string; slug: string };
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
      .eq("content_type", "coloring")
      .eq("is_public", true)
      .single();

    if (bySlug) return bySlug;

    const { data: byId } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, description, aspect_ratio, created_at")
      .eq("id", slug)
      .eq("content_type", "coloring")
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
  const canonicalTheme = dbImage.category || params.theme;
  const theme = await getColoringThemeBySlug(canonicalTheme);
  const themeName = theme?.name || canonicalTheme;
  const imageTitle = dbImage.title || dbImage.prompt;
  const imageDesc = dbImage.description || dbImage.prompt;

  return buildPageMetadata({
    subject: imageTitle,
    description: imageDesc,
    contentType: "coloring",
    categoryName: themeName,
    path: `coloring-pages/${canonicalTheme}/${canonicalSlug}`,
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
      .eq("content_type", "coloring")
      .eq("is_public", true)
      .or(
        `category.eq.${category},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
      .neq("slug", excludeSlug)
      .order("created_at", { ascending: false })
      .limit(8);

    return (data || []).map((r: { title: string; slug: string; category: string; image_url: string; aspect_ratio: string }) => ({
      title: r.title || "Coloring page",
      slug: r.slug,
      category: r.category,
      url: r.image_url,
      aspect_ratio: r.aspect_ratio || "3:4",
    }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const dbRow = await getDbImage(params.slug);
  if (!dbRow) notFound();

  const canonicalSlug = dbRow.slug || dbRow.id;
  const canonicalTheme = dbRow.category || params.theme;

  if (params.theme !== canonicalTheme || params.slug !== canonicalSlug) {
    permanentRedirect(`/coloring-pages/${canonicalTheme}/${canonicalSlug}`);
  }

  const image = {
    title: dbRow.title || dbRow.prompt,
    slug: canonicalSlug,
    category: canonicalTheme,
    url: dbRow.image_url,
    description: dbRow.description || dbRow.prompt,
    tags: ["coloring page", dbRow.category].filter(Boolean) as string[],
    aspect_ratio: dbRow.aspect_ratio || "3:4",
  };

  const relatedImages = await getRelatedImages(canonicalTheme, canonicalSlug);

  const theme = await getColoringThemeBySlug(canonicalTheme);
  const themeName = theme?.name || humanizeSlug(canonicalTheme);

  return (
    <>
      <ImageDetailPage
        image={image}
        categorySlug={canonicalTheme}
        isColoringPage
        relatedImages={relatedImages}
        categoryName={themeName}
        imageId={dbRow.id}
      />
      <MarketingFooter />
    </>
  );
}
