export const STYLES = {
  flat: "flat vector illustration, white background, no shadows, bold outlines",
  outline: "minimal outline illustration, white background, thin clean lines, monochrome",
  cartoon: "cartoon style illustration, white background, bold colors, friendly characters",
  sticker: "sticker illustration style, white background, thick outline, vibrant colors, cute",
  vintage: "vintage retro illustration, muted colors, textured, nostalgic style",
  watercolor: "watercolor painting illustration, soft edges, paint splashes, delicate brushstrokes, pastel and vibrant watercolor tones, white paper background",
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
};

const PROMPT_TEMPLATES = {
  clipart: "clip art, isolated object, no text",
  illustration: "illustration, isolated subject, no text, not a photograph",
  whimsical: "whimsical art print, expressive, artistic, isolated subject, no text, not a photograph",
} as const;

type TemplateKey = keyof typeof PROMPT_TEMPLATES;

const STYLE_TEMPLATE_MAP: Record<StyleKey, TemplateKey> = {
  flat: "clipart",
  outline: "clipart",
  cartoon: "clipart",
  sticker: "clipart",
  vintage: "illustration",
  watercolor: "illustration",
};

export function buildPrompt(userPrompt: string, style: StyleKey): string {
  const descriptor = STYLES[style];
  const template = PROMPT_TEMPLATES[STYLE_TEMPLATE_MAP[style]];
  return `${userPrompt}. Style: ${descriptor}, ${template}`;
}
