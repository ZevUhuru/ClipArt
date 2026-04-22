// ---------------------------------------------------------------------------
// Two-axis content model: ContentType (output format) x Style (visual aesthetic)
// ---------------------------------------------------------------------------

export type ContentType = "clipart" | "illustration" | "coloring";

// Pure aesthetic descriptors — no background/isolation/format directives
export const STYLE_DESCRIPTORS = {
  // Shared (clipart + illustration)
  flat: "flat vector, bold outlines, clean shapes, solid colors",
  cartoon: "cartoon style, bold colors, expressive, friendly",
  watercolor: "watercolor painting, soft edges, paint splashes, delicate brushstrokes, vibrant tones",
  vintage: "vintage retro, muted colors, textured, nostalgic style",
  "3d": "3D rendered, soft lighting, smooth materials, clean render",
  doodle: "hand-drawn doodle, sketchy lines, playful, casual ink style",
  kawaii: "kawaii style, super cute, pastel colors, rounded shapes, happy expression",

  // Clip art exclusive
  outline: "minimal outline, thin clean lines, monochrome",
  sticker: "sticker style, thick outline, vibrant colors, cute",
  chibi: "chibi anime, cute big head small body, bold outlines, colorful",
  pixel: "pixel art, retro 8-bit, clean pixels, no anti-aliasing",

  // Illustration exclusive
  storybook: "storybook illustration, warm painterly style, soft lighting, rich textures, inviting atmosphere",
  "digital-art": "digital illustration, clean modern style, polished, professional rendering",
  fantasy: "fantasy art, dramatic lighting, rich atmosphere, epic and immersive",
  anime: "anime art style, vibrant, expressive, dynamic composition",
  collage: "mixed media collage, torn paper textures, layered materials, tactile",
  gouache: "gouache painting, flat opaque colors, matte finish, mid-century picture book feel",
  "paper-art": "paper craft, layered papercut, dimensional, clean edges, shadow depth",
  "chalk-pastel": "chalk pastel, soft dreamy textures, gentle blending, warm atmosphere",
  retro: "retro mid-century modern, geometric shapes, limited color palette, textured print feel",

  // Coloring (single style for now, expandable later)
  coloring: "thick clean outlines, large enclosed areas for coloring, simple bold line art",
} as const;

export type StyleKey = keyof typeof STYLE_DESCRIPTORS;

export const CONTENT_TYPE_TEMPLATES: Record<ContentType, string> = {
  clipart: "clip art, isolated object on plain white background",
  illustration: "illustration, full scene with detailed background, environment, and lighting",
  coloring: "coloring book page, printable line art, black outlines only, no fills, no shading, no color, no gradients, white background",
};

export const VALID_STYLES: Record<ContentType, StyleKey[]> = {
  clipart: ["flat", "outline", "cartoon", "sticker", "vintage", "watercolor", "chibi", "pixel", "kawaii", "3d", "doodle"],
  illustration: [
    "flat", "cartoon", "watercolor", "vintage", "3d", "doodle", "kawaii",
    "storybook", "digital-art", "fantasy", "anime", "collage", "gouache", "paper-art", "chalk-pastel", "retro",
  ],
  coloring: ["coloring"],
};

export const CONTENT_TYPE_ASPECT: Record<ContentType, AspectRatio> = {
  clipart: "1:1",
  illustration: "4:3",
  coloring: "3:4",
};

// Runtime model routing keys. `gemini` points at the current Gemini Flash
// Image line (upgraded from 2.5 → 3.1 Flash Image Preview / "Nano Banana 2"
// on 2026-04-21). `gemini-pro` routes to Gemini 3 Pro Image ("Nano Banana
// Pro") — premium tier, reserve for hero/cover work.
export type ModelKey = "gemini" | "gemini-pro" | "gpt-image-1" | "gpt-image-1.5" | "gpt-image-2";

export const STYLE_MODEL_MAP: Record<StyleKey, ModelKey> = {
  flat: "gemini",
  outline: "gemini",
  cartoon: "gemini",
  sticker: "gemini",
  vintage: "gemini",
  watercolor: "gemini",
  chibi: "gemini",
  pixel: "gemini",
  kawaii: "gemini",
  "3d": "gemini",
  doodle: "gemini",
  coloring: "gemini",
  storybook: "gemini",
  "digital-art": "gemini",
  fantasy: "gemini",
  anime: "gemini",
  collage: "gemini",
  gouache: "gemini",
  "paper-art": "gemini",
  "chalk-pastel": "gemini",
  retro: "gemini",
};

export type AspectRatio = "1:1" | "3:4" | "4:3";

export const COLORING_ASPECT_OPTIONS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "3:4", label: "Portrait", icon: "portrait" },
  { value: "4:3", label: "Landscape", icon: "landscape" },
  { value: "1:1", label: "Square", icon: "square" },
];

export const ILLUSTRATION_ASPECT_OPTIONS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "4:3", label: "Landscape", icon: "landscape" },
  { value: "3:4", label: "Portrait", icon: "portrait" },
  { value: "1:1", label: "Square", icon: "square" },
];

export const STYLE_LABELS: Record<StyleKey, string> = {
  flat: "Flat",
  outline: "Outline",
  cartoon: "Cartoon",
  sticker: "Sticker",
  vintage: "Vintage",
  watercolor: "Watercolor",
  chibi: "Chibi",
  pixel: "Pixel",
  kawaii: "Kawaii",
  "3d": "3D",
  doodle: "Doodle",
  coloring: "Coloring",
  storybook: "Storybook",
  "digital-art": "Digital Art",
  fantasy: "Fantasy",
  anime: "Anime",
  collage: "Collage",
  gouache: "Gouache",
  "paper-art": "Paper Art",
  "chalk-pastel": "Chalk Pastel",
  retro: "Retro",
};

export function getStylesForContentType(contentType: ContentType): StyleKey[] {
  return VALID_STYLES[contentType];
}

export function isValidStyleForContentType(style: StyleKey, contentType: ContentType): boolean {
  return VALID_STYLES[contentType].includes(style);
}

export function getDefaultAspect(contentType: ContentType): AspectRatio {
  return CONTENT_TYPE_ASPECT[contentType];
}

export function buildPrompt(userPrompt: string, style: StyleKey, contentType?: ContentType): string {
  const ct = contentType ?? (style === "coloring" ? "coloring" : "clipart");
  const descriptor = STYLE_DESCRIPTORS[style];
  const template = CONTENT_TYPE_TEMPLATES[ct];
  return `${userPrompt}. Style: ${descriptor}, ${template}`;
}

// ---------------------------------------------------------------------------
// Backward-compatible aliases
// ---------------------------------------------------------------------------

export const STYLES = STYLE_DESCRIPTORS;

export const STYLE_ASPECT_MAP: Record<string, AspectRatio> = Object.fromEntries(
  Object.keys(STYLE_DESCRIPTORS).map((key) => {
    if (key === "coloring") return [key, "3:4" as AspectRatio];
    if (VALID_STYLES.illustration.includes(key as StyleKey) && !VALID_STYLES.clipart.includes(key as StyleKey)) {
      return [key, "4:3" as AspectRatio];
    }
    return [key, "1:1" as AspectRatio];
  }),
);
