import { getCharacterForPack } from "@/data/characters";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface ParentPackContext {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  item_count: number;
  downloads: number;
  is_featured: boolean;
  categorySlug: string;
  categoryName: string;
  characterSlug?: string;
  characterName?: string;
}

interface PackItemJoinRow {
  packs:
    | {
        id: string;
        title: string;
        slug: string;
        cover_image_url: string | null;
        item_count: number;
        downloads: number;
        is_featured: boolean;
        tags: string[] | null;
        categories: { slug: string; name: string } | null;
      }
    | {
        id: string;
        title: string;
        slug: string;
        cover_image_url: string | null;
        item_count: number;
        downloads: number;
        is_featured: boolean;
        tags: string[] | null;
        categories: { slug: string; name: string } | null;
      }[]
    | null;
}

export async function getParentPacksForGeneration(
  generationId: string,
  currentCategorySlug?: string,
): Promise<ParentPackContext[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("pack_items")
      .select(
        "packs!inner(id, title, slug, cover_image_url, item_count, downloads, is_featured, tags, categories!category_id(slug, name))",
      )
      .eq("generation_id", generationId)
      .eq("packs.is_published", true)
      .eq("packs.visibility", "public");

    const parentPacks: ParentPackContext[] = ((data || []) as PackItemJoinRow[]).flatMap((row) => {
        const pack = Array.isArray(row.packs) ? row.packs[0] : row.packs;
        if (!pack) return [];

        const character = getCharacterForPack({
          slug: pack.slug,
          title: pack.title,
          tags: pack.tags,
          categories: pack.categories,
        });

        return {
          id: pack.id,
          title: pack.title,
          slug: pack.slug,
          cover_image_url: pack.cover_image_url,
          item_count: pack.item_count,
          downloads: pack.downloads,
          is_featured: pack.is_featured,
          categorySlug: character?.primaryCategorySlug || pack.categories?.slug || "all",
          categoryName: character ? "Characters" : pack.categories?.name || "All",
          characterSlug: character?.slug,
          characterName: character?.name,
        };
      });

    return parentPacks.sort((a, b) => {
        const aScore =
          (a.is_featured ? 1000 : 0) +
          (a.categorySlug === currentCategorySlug ? 250 : 0) +
          (a.characterSlug ? 100 : 0) +
          a.item_count * 2 +
          a.downloads;
        const bScore =
          (b.is_featured ? 1000 : 0) +
          (b.categorySlug === currentCategorySlug ? 250 : 0) +
          (b.characterSlug ? 100 : 0) +
          b.item_count * 2 +
          b.downloads;

        return bScore - aScore;
      });
  } catch {
    return [];
  }
}
