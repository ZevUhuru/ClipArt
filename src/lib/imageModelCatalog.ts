// ---------------------------------------------------------------------------
// Image model catalog — single source of truth for model metadata, pricing,
// capabilities, and supported API parameters.
//
// Consumed by:
//   - app/admin/models/page.tsx          (overview + routing)
//   - app/admin/models/[model]/page.tsx  (detail page)
//   - src/lib/imageGen.ts                (runtime dispatch, cost estimation)
//
// Pricing verified 2026-04-21 from the per-image table on
// platform.openai.com/docs/guides/image-generation. Update the `verifiedAt`
// field below whenever these numbers are refreshed.
// ---------------------------------------------------------------------------

import type { ModelKey } from "./styles";

export type Quality = "low" | "medium" | "high" | "flat";
export type AspectKey = "square" | "landscape" | "portrait";

export const ASPECT_INFO: Record<
  AspectKey,
  { ratio: string; resolution: string; long: string; contentTypes: string[] }
> = {
  square:    { ratio: "1:1", resolution: "1024×1024", long: "Square",    contentTypes: ["clipart"] },
  landscape: { ratio: "4:3", resolution: "1536×1024", long: "Landscape", contentTypes: ["illustration"] },
  portrait:  { ratio: "3:4", resolution: "1024×1536", long: "Portrait",  contentTypes: ["coloring"] },
};

export interface ModelParam {
  name: string;
  type: string;
  values?: string;
  required?: boolean;
  description: string;
}

export interface ImageModelEntry {
  key: ModelKey;
  label: string;
  provider: "OpenAI" | "Google";
  endpoint: string;
  apiModelId: string;
  releaseDate: string;
  tagline: string;
  description: string;
  status: "current" | "legacy" | "new";
  badge?: { label: string; tone: "indigo" | "purple" | "emerald" | "gray" };
  docsUrl: string;

  capabilities: {
    positive: string[];
    negative: string[];
  };

  // Pricing[quality][aspect] = USD per image. "flat" quality = single price.
  pricing: Partial<Record<Quality, Record<AspectKey, number>>>;
  supportsQualityTiers: boolean;

  params: ModelParam[];
  exampleCall: string;
}

// Revenue per credit at lowest pack tier ($0.05/credit) — used for margin calcs.
export const REVENUE_PER_CREDIT = 0.05;

export const IMAGE_MODELS: ImageModelEntry[] = [
  {
    key: "gemini",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    endpoint: "generativelanguage.googleapis.com",
    apiModelId: "gemini-2.5-flash-image",
    releaseDate: "2025-02",
    tagline: "Flat-price, vector-friendly clip art baseline",
    description:
      "Google's multimodal Flash model with image output. Generates clean, vector-style clip art at a single per-image rate regardless of aspect ratio. Supports transparent backgrounds and has a batch mode at 50% cost.",
    status: "current",
    docsUrl: "https://ai.google.dev/gemini-api/docs/image-generation",
    capabilities: {
      positive: [
        "Flat price across aspect ratios",
        "Batch API (50% off)",
        "Transparent background",
        "Fast — 5–10s",
        "Clean vector output",
      ],
      negative: ["No quality tiers", "No in-image text guarantee"],
    },
    pricing: {
      flat: { square: 0.039, landscape: 0.039, portrait: 0.039 },
    },
    supportsQualityTiers: false,
    params: [
      { name: "prompt",          type: "string", required: true,  description: "Text prompt describing the image." },
      { name: "aspectRatio",     type: "enum",   values: "1:1 | 4:3 | 3:4", description: "Output aspect ratio." },
      { name: "batchMode",       type: "boolean", description: "If true, routes through batch API at 50% cost (async, ~24h SLA)." },
    ],
    exampleCall:
`import { generateClipArt } from "@/lib/gemini";

const buffer = await generateClipArt(
  "a golden retriever puppy",
  "1:1"
);`,
  },

  {
    key: "gpt-image-1",
    label: "GPT Image 1",
    provider: "OpenAI",
    endpoint: "api.openai.com/v1/images/generations",
    apiModelId: "gpt-image-1",
    releaseDate: "2025-04",
    tagline: "Legacy — superseded by gpt-image-1.5 at a lower price",
    description:
      "The original gpt-image-1 released in early 2025. Still works, but gpt-image-1.5 matches it on capabilities (transparent backgrounds, input_fidelity, edits) at meaningfully lower cost. Keep on-hand only for strict reproducibility of existing content.",
    status: "legacy",
    badge: { label: "Legacy · use 1.5", tone: "gray" },
    docsUrl: "https://platform.openai.com/docs/guides/image-generation?image-generation-model=GPT-image-1",
    capabilities: {
      positive: [
        "Transparent background",
        "input_fidelity param",
        "Image edits (inpainting/masking)",
        "Reference-image workflows",
      ],
      negative: ["Older base model", "Expensive at non-square"],
    },
    pricing: {
      low:    { square: 0.011, landscape: 0.016, portrait: 0.016 },
      medium: { square: 0.042, landscape: 0.063, portrait: 0.063 },
      high:   { square: 0.167, landscape: 0.250, portrait: 0.250 },
    },
    supportsQualityTiers: true,
    params: [
      { name: "model",             type: "string", required: true, values: "\"gpt-image-1\"", description: "Model identifier." },
      { name: "prompt",            type: "string", required: true, description: "Text prompt." },
      { name: "size",              type: "enum",   values: "1024×1024 | 1024×1536 | 1536×1024", description: "Output resolution." },
      { name: "quality",           type: "enum",   values: "low | medium | high", description: "Rendering quality. Directly controls cost." },
      { name: "background",        type: "enum",   values: "transparent | opaque | auto", description: "Background handling. Transparent supported on PNG output." },
      { name: "output_format",     type: "enum",   values: "png | jpeg | webp", description: "File format of returned base64 blob." },
      { name: "output_compression", type: "number", description: "Compression level for JPEG/WebP (0–100)." },
      { name: "moderation",        type: "enum",   values: "auto | low", description: "Content moderation strictness." },
      { name: "input_fidelity",    type: "enum",   values: "low | high", description: "Controls how strongly input images are preserved during edits." },
      { name: "n",                 type: "number", description: "Number of images (we always pass 1)." },
    ],
    exampleCall:
`import { generateWithGptImage1 } from "@/lib/gptImage1";

const buffer = await generateWithGptImage1(
  "a golden retriever puppy",
  "1:1",
  "medium"
);`,
  },

  {
    key: "gpt-image-1.5",
    label: "GPT Image 1.5",
    provider: "OpenAI",
    endpoint: "api.openai.com/v1/images/generations",
    apiModelId: "gpt-image-1.5",
    releaseDate: "2025-11",
    tagline: "Recommended OpenAI default — cheaper than 1, keeps transparent BG",
    description:
      "Mid-generation OpenAI model released late 2025. Drop-in upgrade for gpt-image-1: same API shape, same capabilities (transparent backgrounds, input_fidelity, image edits), but cheaper at every quality × aspect slot. Unlike gpt-image-2 it still supports transparent backgrounds, which makes it the best choice for clipart workflows that need isolated subjects.",
    status: "current",
    badge: { label: "Recommended", tone: "emerald" },
    docsUrl: "https://platform.openai.com/docs/guides/image-generation?image-generation-model=GPT-image-1",
    capabilities: {
      positive: [
        "Transparent background",
        "input_fidelity param",
        "Image edits (inpainting/masking)",
        "Cheaper than gpt-image-1 at every tier",
      ],
      negative: ["No in-image text guarantee (vs gpt-image-2)"],
    },
    pricing: {
      low:    { square: 0.009, landscape: 0.013, portrait: 0.013 },
      medium: { square: 0.034, landscape: 0.050, portrait: 0.050 },
      high:   { square: 0.133, landscape: 0.200, portrait: 0.200 },
    },
    supportsQualityTiers: true,
    params: [
      { name: "model",             type: "string", required: true, values: "\"gpt-image-1.5\"", description: "Model identifier." },
      { name: "prompt",            type: "string", required: true, description: "Text prompt." },
      { name: "size",              type: "enum",   values: "1024×1024 | 1024×1536 | 1536×1024", description: "Output resolution." },
      { name: "quality",           type: "enum",   values: "low | medium | high", description: "Rendering quality. Directly controls cost." },
      { name: "background",        type: "enum",   values: "transparent | opaque | auto", description: "Background handling. Transparent supported on PNG output." },
      { name: "output_format",     type: "enum",   values: "png | jpeg | webp", description: "File format of returned base64 blob." },
      { name: "output_compression", type: "number", description: "Compression level for JPEG/WebP (0–100)." },
      { name: "moderation",        type: "enum",   values: "auto | low", description: "Content moderation strictness." },
      { name: "input_fidelity",    type: "enum",   values: "low | high", description: "Controls how strongly input images are preserved during edits." },
      { name: "n",                 type: "number", description: "Number of images (we always pass 1)." },
    ],
    exampleCall:
`import { generateWithGptImage15 } from "@/lib/gptImage15";

const buffer = await generateWithGptImage15(
  "a golden retriever puppy",
  "1:1",
  "medium"
);`,
  },

  {
    key: "gpt-image-2",
    label: "GPT Image 2",
    provider: "OpenAI",
    endpoint: "api.openai.com/v1/images/generations",
    apiModelId: "gpt-image-2",
    releaseDate: "2026-04-21",
    tagline: "State of the art — ChatGPT Images 2.0",
    description:
      "OpenAI's latest generation, branded ChatGPT Images 2.0. Cheaper than gpt-image-1 on non-square output and at low quality, more expensive at medium-square. Generates text inside images reliably, handles multilingual prompts, and supports up to 2K resolution. Always operates at high-fidelity for image inputs, so input_fidelity is no longer a parameter.",
    status: "new",
    badge: { label: "New · Apr 2026", tone: "indigo" },
    docsUrl: "https://platform.openai.com/docs/guides/image-generation",
    capabilities: {
      positive: [
        "Up to 2K resolution",
        "Reliable in-image text",
        "Multilingual prompts",
        "Always high-fidelity on image inputs",
        "Thousands of valid resolutions",
      ],
      negative: ["No transparent background", "No input_fidelity param"],
    },
    pricing: {
      low:    { square: 0.006, landscape: 0.005, portrait: 0.005 },
      medium: { square: 0.053, landscape: 0.041, portrait: 0.041 },
      high:   { square: 0.211, landscape: 0.165, portrait: 0.165 },
    },
    supportsQualityTiers: true,
    params: [
      { name: "model",         type: "string", required: true, values: "\"gpt-image-2\"", description: "Model identifier." },
      { name: "prompt",        type: "string", required: true, description: "Text prompt. Handles multilingual input natively." },
      { name: "size",          type: "enum",   values: "1024×1024 | 1024×1536 | 1536×1024 | up to 2K", description: "Output resolution. Thousands of valid sizes supported beyond the standard three." },
      { name: "quality",       type: "enum",   values: "low | medium | high", description: "Rendering quality. Directly controls cost." },
      { name: "output_format", type: "enum",   values: "png | jpeg | webp", description: "File format." },
      { name: "moderation",    type: "enum",   values: "auto | low", description: "Content moderation strictness." },
      { name: "n",             type: "number", description: "Number of images (we always pass 1)." },
    ],
    exampleCall:
`import { generateWithGptImage2 } from "@/lib/gptImage2";

const buffer = await generateWithGptImage2(
  "a golden retriever puppy, photographic",
  "1:1",
  "medium"
);`,
  },
];

export const MODEL_BY_KEY: Record<ModelKey, ImageModelEntry> =
  Object.fromEntries(IMAGE_MODELS.map((m) => [m.key, m])) as Record<ModelKey, ImageModelEntry>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function priceFor(model: ModelKey, quality: Quality, aspect: AspectKey): number | null {
  const entry = MODEL_BY_KEY[model];
  if (!entry) return null;
  // If the model is flat-priced, ignore requested quality and return flat.
  const tier = entry.supportsQualityTiers ? entry.pricing[quality] : entry.pricing.flat;
  return tier ? tier[aspect] : null;
}

export function isKnownModel(value: unknown): value is ModelKey {
  return typeof value === "string" && value in MODEL_BY_KEY;
}

// Coerces legacy or unknown values to a valid ModelKey.
export function normalizeModelKey(value: unknown): ModelKey {
  if (isKnownModel(value)) return value;
  if (value === "dalle") return "gpt-image-1";
  return "gemini";
}

export function normalizeQuality(value: unknown): Quality {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}
