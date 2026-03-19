export const STYLES = {
  flat: "flat vector illustration, white background, no shadows, bold outlines",
  outline: "minimal outline illustration, white background, thin clean lines, monochrome",
  cartoon: "cartoon style illustration, white background, bold colors, friendly characters",
  sticker: "sticker illustration style, white background, thick outline, vibrant colors, cute",
  vintage: "vintage retro illustration, muted colors, textured, nostalgic style",
} as const;

export type StyleKey = keyof typeof STYLES;

export function buildPrompt(userPrompt: string, style: StyleKey): string {
  const descriptor = STYLES[style];
  return `${userPrompt}. Style: ${descriptor}, clip art, isolated object, no text`;
}
