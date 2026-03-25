import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getColoringThemeBySlug } from "@/lib/categories";
import { ImageDetailPage } from "@/components/ImageDetailPage";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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
      .eq("style", "coloring")
      .eq("is_public", true)
      .single();

    if (bySlug) return bySlug;

    const { data: byId } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, description, aspect_ratio, created_at")
      .eq("id", slug)
      .eq("style", "coloring")
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

  const theme = await getColoringThemeBySlug(params.theme);
  const themeName = theme?.name || params.theme;
  const imageTitle = dbImage.title || dbImage.prompt;
  const imageDesc = dbImage.description || dbImage.prompt;
  const title = `${imageTitle} — Free ${themeName} Coloring Page | clip.art`;

  return {
    title,
    description: imageDesc,
    openGraph: {
      title,
      description: imageDesc,
      url: `https://clip.art/coloring-pages/${params.theme}/${dbImage.slug || dbImage.id}`,
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
      canonical: `https://clip.art/coloring-pages/${params.theme}/${dbImage.slug || dbImage.id}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const dbRow = await getDbImage(params.slug);
  if (!dbRow) notFound();

  const image = {
    title: dbRow.title || dbRow.prompt,
    slug: dbRow.slug || dbRow.id,
    category: dbRow.category || params.theme,
    url: dbRow.image_url,
    description: dbRow.description || dbRow.prompt,
    tags: ["coloring page", dbRow.category].filter(Boolean) as string[],
    aspect_ratio: dbRow.aspect_ratio || "3:4",
  };

  return <ImageDetailPage image={image} categorySlug={params.theme} isColoringPage />;
}
