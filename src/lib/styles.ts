export const STYLES = {
  flat: "flat vector illustration, white background, no shadows, bold outlines",
  outline: "minimal outline illustration, white background, thin clean lines, monochrome",
  cartoon: "cartoon style illustration, white background, bold colors, friendly characters",
  sticker: "sticker illustration style, white background, thick outline, vibrant colors, cute",
  vintage: "vintage retro illustration, muted colors, textured, nostalgic style",
  watercolor: "watercolor painting illustration, soft edges, paint splashes, delicate brushstrokes, pastel and vibrant watercolor tones, white paper background",
  coloring: "black and white coloring book page, thick clean outlines, large enclosed areas for coloring, no fills, no shading, no color, no gradients, simple bold line art, white background",
} as const;

export type StyleKey = keyof typeof STYLES;

export type ModelKey = "gemini" | "dalle";

export const STYLE_MODEL_MAP: Record<StyleKey, ModelKey> = {
  flat: "gemini",
  outline: "gemini",
  cartoon: "gemini",
  sticker: "gemini",
  vintage: "gemini",
  watercolor: "gemini",
  coloring: "gemini",
};

export type AspectRatio = "1:1" | "3:4" | "4:3";

export const COLORING_ASPECT_OPTIONS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "3:4", label: "Portrait", icon: "portrait" },
  { value: "4:3", label: "Landscape", icon: "landscape" },
  { value: "1:1", label: "Square", icon: "square" },
];

export const STYLE_ASPECT_MAP: Record<StyleKey, AspectRatio> = {
  flat: "1:1",
  outline: "1:1",
  cartoon: "1:1",
  sticker: "1:1",
  vintage: "1:1",
  watercolor: "1:1",
  coloring: "3:4",
};

const PROMPT_TEMPLATES = {
  clipart: "clip art, isolated object, no text",
  illustration: "illustration, isolated subject, no text, not a photograph",
  whimsical: "whimsical art print, expressive, artistic, isolated subject, no text, not a photograph",
  coloringpage: "coloring book page, printable line art, black outlines only, no text, no color, white background",
} as const;

type TemplateKey = keyof typeof PROMPT_TEMPLATES;

const STYLE_TEMPLATE_MAP: Record<StyleKey, TemplateKey> = {
  flat: "clipart",
  outline: "clipart",
  cartoon: "clipart",
  sticker: "clipart",
  vintage: "illustration",
  watercolor: "illustration",
  coloring: "coloringpage",
};

export function buildPrompt(userPrompt: string, style: StyleKey): string {
  const descriptor = STYLES[style];
  const template = PROMPT_TEMPLATES[STYLE_TEMPLATE_MAP[style]];
  return `${userPrompt}. Style: ${descriptor}, ${template}`;
}
