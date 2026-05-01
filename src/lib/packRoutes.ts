import { getCharacterForPack } from "@/data/characters";

interface PackRouteCandidate {
  slug: string;
  title: string;
  tags?: string[] | null;
  categories?: { slug: string } | null;
}

export function packCategorySlug(pack: PackRouteCandidate) {
  return getCharacterForPack(pack)?.primaryCategorySlug || pack.categories?.slug || "all";
}

export function packPath(pack: PackRouteCandidate) {
  return `/packs/${packCategorySlug(pack)}/${pack.slug}`;
}
