import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sampleImages, imageBySlug } from "@/data/sampleGallery";
import { categoryMap, getCategorySlugForImage } from "@/data/categories";
import { ImageDetailPage } from "@/components/ImageDetailPage";

interface PageProps {
  params: { category: string; slug: string };
}

export function generateStaticParams() {
  return sampleImages.map((img) => ({
    category: getCategorySlugForImage(img),
    slug: img.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const image = imageBySlug.get(params.slug);
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
      images: [
        {
          url: image.url,
          alt: image.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default function Page({ params }: PageProps) {
  const image = imageBySlug.get(params.slug);
  if (!image) notFound();

  const expectedCategory = getCategorySlugForImage(image);
  if (params.category !== expectedCategory) notFound();

  return <ImageDetailPage image={image} categorySlug={params.category} />;
}
