import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getAllCategories, type DbCategory } from "@/lib/categories";
import { CategoryPage } from "@/components/CategoryPage";
import { AnimalAlphabetPage } from "@/components/AnimalAlphabetPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildListingMetadata } from "@/lib/seo";
import {
  getAnimalEntriesByLetter,
  getLetterColoringPages,
  getLetterAnimations,
} from "@/lib/animals";

export const revalidate = 60;

const ANIMAL_ALPHABET_RE = /^animals-that-start-with-([a-z])$/;

interface PageProps {
  params: { category: string };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};

  return buildListingMetadata({
    title: category.meta_title,
    description: category.meta_description,
    categoryName: category.name,
    contentType: "clipart",
    path: category.slug,
  });
}

async function getGalleryImages(categorySlug: string) {
  try {
    const admin = createSupabaseAdmin();
    const catPattern = `%${categorySlug.replace(/-/g, " ")}%`;
    const { data } = await admin
      .from("generations")
      .select("id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at")
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .or(
        `category.eq.${categorySlug},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
      .order("created_at", { ascending: false })
      .limit(60);

    return (data || []).map((row: Record<string, string>) => ({
      slug: row.slug || row.id,
      title: row.title || row.prompt,
      url: row.image_url,
      description: row.prompt,
      category: row.category,
      tags: [row.style, row.category].filter(Boolean),
      aspect_ratio: row.aspect_ratio || "1:1",
    }));
  } catch {
    return [];
  }
}

async function getRelatedCategories(relatedSlugs: string[]): Promise<DbCategory[]> {
  if (!relatedSlugs.length) return [];
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("*")
      .in("slug", relatedSlugs)
      .eq("is_active", true);
    return (data || []) as DbCategory[];
  } catch {
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  const match = ANIMAL_ALPHABET_RE.exec(params.category);

  if (match) {
    const letter = match[1].toUpperCase();
    const [dbImages, relatedCategories, animals] = await Promise.all([
      getGalleryImages(params.category),
      getRelatedCategories(category.related_slugs || []),
      getAnimalEntriesByLetter(letter),
    ]);

    const animalNames = animals.map((a) => a.name);
    const [coloringImages, anims] = await Promise.all([
      getLetterColoringPages(animalNames),
      getLetterAnimations(animalNames),
    ]);

    return (
      <>
        <AnimalAlphabetPage
          category={category}
          letter={letter}
          animals={animals}
          galleryImages={dbImages}
          coloringImages={coloringImages}
          animations={anims}
          relatedCategories={relatedCategories}
        />
        <MarketingFooter />
      </>
    );
  }

  const [dbImages, relatedCategories] = await Promise.all([
    getGalleryImages(params.category),
    getRelatedCategories(category.related_slugs || []),
  ]);

  return (
    <>
      <CategoryPage
        category={category}
        galleryImages={dbImages}
        relatedCategories={relatedCategories}
      />
      <MarketingFooter />
    </>
  );
}
