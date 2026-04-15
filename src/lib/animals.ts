import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface AnimalEntry {
  id: string;
  letter: string;
  name: string;
  slug: string;
  scientific_name: string | null;
  description: string;
  fun_fact: string | null;
  habitat: string | null;
  diet: string | null;
  size: string | null;
  lifespan: string | null;
  conservation_status: string | null;
  sort_order: number;
}

export async function getAnimalEntriesByLetter(
  letter: string,
): Promise<AnimalEntry[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("animal_entries")
      .select("*")
      .eq("letter", letter.toUpperCase())
      .eq("is_active", true)
      .order("sort_order");
    return (data || []) as AnimalEntry[];
  } catch {
    return [];
  }
}

export interface GalleryRow {
  id: string;
  slug: string | null;
  title: string | null;
  prompt: string;
  image_url: string;
  style: string;
  category: string;
  aspect_ratio: string;
  created_at: string;
}

export async function getAnimalClipArt(
  animalName: string,
  limit = 6,
): Promise<GalleryRow[]> {
  try {
    const admin = createSupabaseAdmin();
    const pattern = `%${animalName.toLowerCase()}%`;
    const { data } = await admin
      .from("generations")
      .select(
        "id, slug, title, prompt, image_url, style, category, aspect_ratio, created_at",
      )
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .or(`prompt.ilike.${pattern},title.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []) as GalleryRow[];
  } catch {
    return [];
  }
}

export async function getLetterGallery(
  categorySlug: string,
  limit = 30,
  offset = 0,
): Promise<{ images: GalleryRow[]; hasMore: boolean }> {
  try {
    const admin = createSupabaseAdmin();
    const catPattern = `%${categorySlug.replace(/-/g, " ")}%`;
    const { data } = await admin
      .from("generations")
      .select(
        "id, slug, title, prompt, image_url, style, category, aspect_ratio, created_at",
      )
      .eq("is_public", true)
      .eq("content_type", "clipart")
      .or(
        `category.eq.${categorySlug},prompt.ilike.${catPattern},title.ilike.${catPattern}`,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);

    const images = (data || []) as GalleryRow[];
    return { images, hasMore: images.length > limit };
  } catch {
    return { images: [], hasMore: false };
  }
}

export async function getLetterColoringPages(
  animalNames: string[],
  limit = 12,
): Promise<GalleryRow[]> {
  if (!animalNames.length) return [];
  try {
    const admin = createSupabaseAdmin();
    const patterns = animalNames
      .map((n) => `prompt.ilike.%${n.toLowerCase()}%`)
      .join(",");
    const { data } = await admin
      .from("generations")
      .select(
        "id, slug, title, prompt, image_url, style, category, aspect_ratio, created_at",
      )
      .eq("is_public", true)
      .eq("content_type", "coloring")
      .or(patterns)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []) as GalleryRow[];
  } catch {
    return [];
  }
}

export async function getLetterAnimations(
  animalNames: string[],
  limit = 6,
): Promise<
  {
    id: string;
    slug: string;
    title: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
  }[]
> {
  if (!animalNames.length) return [];
  try {
    const admin = createSupabaseAdmin();
    const patterns = animalNames
      .map((n) => `title.ilike.%${n.toLowerCase()}%`)
      .join(",");
    const { data } = await admin
      .from("animations")
      .select("id, slug, title, thumbnail_url, video_url")
      .eq("status", "completed")
      .eq("is_public", true)
      .or(patterns)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []) as {
      id: string;
      slug: string;
      title: string | null;
      thumbnail_url: string | null;
      video_url: string | null;
    }[];
  } catch {
    return [];
  }
}
