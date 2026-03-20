import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { sampleImages } from "@/data/sampleGallery";
import { getCategorySlugForImage } from "@/data/categories";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const imagePages: MetadataRoute.Sitemap = sampleImages.map((img) => {
    const categorySlug = getCategorySlugForImage(img);
    return {
      url: `${baseUrl}/${categorySlug}/${img.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  return [...staticPages, ...categoryPages, ...imagePages];
}
