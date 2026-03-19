import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, categoryMap } from "@/data/categories";
import { CategoryPage } from "@/components/CategoryPage";

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

export default function Page({ params }: PageProps) {
  const category = categoryMap.get(params.category);
  if (!category) notFound();

  return <CategoryPage category={category} />;
}
