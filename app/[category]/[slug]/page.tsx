import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sampleImages, imageBySlug } from "@/data/sampleGallery";
import { categoryMap, getCategorySlugForImage } from "@/data/categories";
import { ImageDetailPage } from "@/components/ImageDetailPage";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

interface PageProps {
  params: { category: string; slug: string };
}

export function generateStaticParams() {
  return sampleImages.map((img) => ({
    category: getCategorySlugForImage(img),
    slug: img.slug,
  }));
}

async function getDbImage(slug: string, category: string) {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, created_at")
      .eq("id", slug)
      .eq("is_public", true)
      .single();

    if (!data) return null;
    return {
      title: data.title || data.prompt,
      slug: data.id,
      category: data.category || category,
      url: data.image_url,
      description: data.prompt,
      tags: [data.style, data.category].filter(Boolean) as string[],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const staticImage = imageBySlug.get(params.slug);
  const image = staticImage || (await getDbImage(params.slug, params.category));
  if (!image) return {};

  const category = categoryMap.get(params.category);
  const categoryName = category?.name || params.category;

  const title = `${image.title} — Free ${categoryName} Clip Art | clip.art`;
  const description = image.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://clip.art/${params.category}/${params.slug}`,
      siteName: "clip.art",
      type: "article",
      images: [{ url: image.url, alt: image.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const staticImage = imageBySlug.get(params.slug);

  if (staticImage) {
    const expectedCategory = getCategorySlugForImage(staticImage);
    if (params.category !== expectedCategory) notFound();
    return <ImageDetailPage image={staticImage} categorySlug={params.category} />;
  }

  const dbImage = await getDbImage(params.slug, params.category);
  if (!dbImage) notFound();

  return <ImageDetailPage image={dbImage} categorySlug={params.category} />;
}
