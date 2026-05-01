export interface CharacterReferenceSheet {
  title: string;
  imageUrl: string;
  alt: string;
  description: string;
}

export interface ClipArtCharacter {
  slug: string;
  name: string;
  epithet: string;
  tagline: string;
  quote: string;
  shortDescription: string;
  bio: string;
  traits: string[];
  profileFacts: { label: string; value: string }[];
  storyHooks: string[];
  signatureItems: string[];
  designNotes: string[];
  primaryCategorySlug: string;
  referenceSheets: CharacterReferenceSheet[];
  packSlugs: string[];
  packTitleIncludes: string[];
  packTagMatches: string[];
  coloringPageSlugs: string[];
  worksheetSlugs: string[];
  clipArtSlugs: string[];
}

export const characters: ClipArtCharacter[] = [
  {
    slug: "orion-foxwell",
    name: "Orion Foxwell",
    epithet: "The Railway Detective",
    tagline: "A vintage fox detective built for mystery stories, classroom adventures, and cinematic creative packs.",
    quote: "Every train has a destination. Every case has a truth.",
    shortDescription:
      "Orion Foxwell is a charming fox detective character for mystery packs, classroom stories, coloring pages, worksheets, and narrative clip art sets.",
    bio: "Orion Foxwell is clip.art's first named character IP: a clever, coat-wearing fox detective with a warm vintage storybook feel. His character hub is designed to collect reference sheets, themed packs, individual clip art, coloring pages, worksheets, and future story assets under one reusable identity.",
    traits: [
      "Fox detective",
      "Vintage storybook style",
      "Warm brown coat",
      "Curious, clever, and composed",
      "Built for mystery and classroom storytelling",
    ],
    profileFacts: [
      { label: "Species", value: "Red fox" },
      { label: "Role", value: "Private detective" },
      { label: "Base", value: "Orient Express" },
      { label: "Era", value: "1930s rail mystery" },
    ],
    storyHooks: [
      "A missing heirloom vanishes between stations on a foggy overnight train.",
      "A coded timetable points Orion toward a secret hidden in the dining car.",
      "A classroom mystery worksheet asks students to follow clues across the route.",
    ],
    signatureItems: [
      "Pocket watch",
      "Notebook",
      "Fountain pen",
      "Magnifying glass",
      "Travel trunk",
    ],
    designNotes: [
      "Trench coat, fedora, vest, tie, and warm sepia palette.",
      "Expressions should stay calm, observant, skeptical, amused, or quietly serious.",
      "Scenes work best around trains, rainy platforms, lanterns, luggage, and old station interiors.",
    ],
    primaryCategorySlug: "characters",
    referenceSheets: [
      {
        title: "Orion Foxwell Character Reference Sheet",
        imageUrl: "/assets/characters/orion-foxwell-reference-sheet.png",
        alt: "Orion Foxwell character reference sheet with poses, expressions, and outfit details",
        description:
          "A reusable character sheet for keeping Orion Foxwell consistent across packs, poses, stories, coloring pages, and worksheets.",
      },
      {
        title: "Orient Express Production Reference Sheet",
        imageUrl: "/assets/characters/orion-foxwell-orient-express-reference-sheet.png",
        alt: "Orient Express fox detective production reference sheet with turnaround, costume variations, expressions, props, and train details",
        description:
          "A cleaner production board for Orion's Orient Express identity, with turnaround views, costume variations, expressions, signature items, tools, transport, and scale reference.",
      },
    ],
    packSlugs: [],
    packTitleIncludes: ["orion foxwell"],
    packTagMatches: ["orion-foxwell", "orion foxwell", "character", "characters"],
    coloringPageSlugs: [],
    worksheetSlugs: [],
    clipArtSlugs: [],
  },
];

export function getCharacterBySlug(slug: string) {
  return characters.find((character) => character.slug === slug) || null;
}

export function getCharacterForPack(pack: {
  slug: string;
  title: string;
  tags?: string[] | null;
  categories?: { slug: string } | null;
}) {
  const normalizedTitle = pack.title.toLowerCase();
  const normalizedTags = (pack.tags || []).map((tag) => tag.toLowerCase());

  return (
    characters.find((character) => {
      if (character.packSlugs.includes(pack.slug)) return true;

      const titleMatch = character.packTitleIncludes.some((needle) =>
        normalizedTitle.includes(needle.toLowerCase()),
      );
      if (titleMatch) return true;

      return character.packTagMatches.some((needle) =>
        normalizedTags.includes(needle.toLowerCase()),
      );
    }) || null
  );
}

