import { getCharacterPackArtworkForPack } from "@/data/characters";

export interface PackArtworkOverride {
  title: string;
  imageUrl: string;
  alt: string;
}

interface PackArtworkCandidate {
  slug: string;
  title: string;
  tags?: string[] | null;
  categories?: { slug: string } | null;
}

const PACK_ARTWORK_OVERRIDES: Array<PackArtworkOverride & {
  matches: (pack: PackArtworkCandidate) => boolean;
}> = [
  {
    title: "Kawaii Desserts Christmas Pack",
    imageUrl: "/assets/characters/kawaii-deserts-card-pack-transparent.png",
    alt: "Kawaii Desserts Christmas clipart sealed pink card pack",
    matches: (pack) => {
      const text = `${pack.slug} ${pack.title} ${(pack.tags || []).join(" ")}`.toLowerCase();
      return text.includes("kawaii") && (
        text.includes("dessert") ||
        text.includes("desert") ||
        text.includes("christmas")
      );
    },
  },
];

export function getPackArtworkForPack(pack: PackArtworkCandidate): PackArtworkOverride | null {
  const characterArtwork = getCharacterPackArtworkForPack(pack);
  if (characterArtwork) return characterArtwork;

  return PACK_ARTWORK_OVERRIDES.find((override) => override.matches(pack)) || null;
}
