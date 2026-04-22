// ---------------------------------------------------------------------------
// Image model catalog — single source of truth for model metadata, pricing,
// capabilities, and supported API parameters.
//
// Consumed by:
//   - app/admin/models/page.tsx          (overview + routing)
//   - app/admin/models/[model]/page.tsx  (detail page)
//   - src/lib/imageGen.ts                (runtime dispatch, cost estimation)
//
// Pricing verified 2026-04-21 from:
//   - OpenAI: platform.openai.com/docs/guides/image-generation
//   - Google: ai.google.dev/gemini-api/docs/image-generation
//             (Flash 3.1 "Nano Banana 2" at $0.067/1K,
//              Pro 3 "Nano Banana Pro" at $0.134/1K)
// Update whenever these numbers are refreshed.
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

  // Batch API support. If batchDiscount is set, apply (1 - batchDiscount)
  // multiplier to every pricing cell to get the batch rate.
  // slaHours: expected completion window for batch jobs.
  batch: {
    supported: boolean;
    discount: number;
    slaHours: number;
    notes?: string;
  };

  params: ModelParam[];
  exampleCall: string;
}

// Revenue per credit at lowest pack tier ($0.05/credit) — used for margin calcs.
export const REVENUE_PER_CREDIT = 0.05;

export const IMAGE_MODELS: ImageModelEntry[] = [
  {
    key: "gemini",
    label: "Gemini 3.1 Flash Image",
    provider: "Google",
    endpoint: "generativelanguage.googleapis.com",
    apiModelId: "gemini-3.1-flash-image-preview",
    releaseDate: "2026-02-26",
    tagline: "Nano Banana 2 — flat-price Flash image, #1 on Image Arena",
    description:
      "Google's Flash-tier image model, internally codenamed Nano Banana 2 — successor to gemini-2.5-flash-image. Flat per-image pricing with a 1K/2K/4K resolution ladder, 65K-token context window, and strong text rendering. Ranked #1 on the Artificial Analysis Image Arena at release. Best default for clip art, coloring pages, and illustration volume work.",
    status: "new",
    badge: { label: "New · Nano Banana 2", tone: "indigo" },
    docsUrl: "https://ai.google.dev/gemini-api/docs/image-generation",
    capabilities: {
      positive: [
        "Flat price per resolution",
        "Up to 4K output (1K / 2K / 4K)",
        "Batch API (50% off)",
        "Transparent background",
        "Strong in-image text",
        "65K-token context window",
        "Fast — ~5–10s at 1K",
      ],
      negative: ["Preview API (quota caveats)", "No quality tiers"],
    },
    pricing: {
      // Google official pricing at 1K — per AI Studio / Vertex price sheet.
      // 2K and 4K are available but clip.art generates at 1K, so those are
      // not surfaced in the admin matrix.
      flat: { square: 0.067, landscape: 0.067, portrait: 0.067 },
    },
    supportsQualityTiers: false,
    batch: {
      supported: true,
      discount: 0.5,
      slaHours: 24,
      notes: "Google's Batch API for Gemini — same model, async processing, no output difference.",
    },
    params: [
      { name: "prompt",          type: "string", required: true,  description: "Text prompt describing the image. Handles multilingual input." },
      { name: "aspectRatio",     type: "enum",   values: "1:1 | 4:3 | 3:4 | 16:9 | 9:16 | 21:9", description: "Output aspect ratio." },
      { name: "imageSize",       type: "enum",   values: "1K | 2K | 4K", description: "Output resolution tier. clip.art uses 1K by default." },
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
    key: "gemini-pro",
    label: "Gemini 3 Pro Image",
    provider: "Google",
    endpoint: "generativelanguage.googleapis.com",
    apiModelId: "gemini-3-pro-image-preview",
    releaseDate: "2025-11-20",
    tagline: "Nano Banana Pro — state-of-the-art Gemini image model",
    description:
      "Google's premium image model, internally codenamed Nano Banana Pro. Built for complex, multi-turn image generation and editing with state-of-the-art reasoning, accurate text rendering, and fine control over details. Accepts up to 14 reference images per prompt and outputs up to 4K. Roughly 2× the cost of Flash (NB2) — reserve for hero assets, book covers, and premium illustrations rather than batch/volume work.",
    status: "new",
    badge: { label: "Premium · Nano Banana Pro", tone: "purple" },
    docsUrl: "https://deepmind.google/models/gemini-image/pro/",
    capabilities: {
      positive: [
        "State-of-the-art reasoning",
        "Accurate text rendering",
        "Up to 14 reference images",
        "Up to 4K output",
        "Multiple aspect ratios",
        "Batch API (50% off)",
        "Multi-turn editing",
      ],
      negative: ["Preview API (quota caveats)", "~2× Flash price at 1K", "Slower than Flash"],
    },
    pricing: {
      // Google official pricing at 1K — per AI Studio / Vertex price sheet.
      flat: { square: 0.134, landscape: 0.134, portrait: 0.134 },
    },
    supportsQualityTiers: false,
    batch: {
      supported: true,
      discount: 0.5,
      slaHours: 24,
      notes: "Google's Batch API for Gemini — same model, async processing, no output difference.",
    },
    params: [
      { name: "prompt",          type: "string", required: true,  description: "Text prompt. Handles multilingual input and long-form instructions." },
      { name: "referenceImages", type: "array",  values: "up to 14 images", description: "Optional reference images for style/character consistency or multi-image compositions." },
      { name: "aspectRatio",     type: "enum",   values: "1:1 | 3:2 | 2:3 | 3:4 | 4:3 | 4:5 | 5:4 | 9:16 | 16:9 | 21:9", description: "Output aspect ratio — full range supported." },
      { name: "imageSize",       type: "enum",   values: "1K | 2K | 4K", description: "Output resolution tier." },
      { name: "batchMode",       type: "boolean", description: "If true, routes through batch API at 50% cost (async, ~24h SLA)." },
    ],
    exampleCall:
`import { generateWithGeminiPro } from "@/lib/geminiPro";

const buffer = await generateWithGeminiPro(
  "cover illustration of a sleepy fox reading a book of spells",
  "3:4"
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
        "Batch API (50% off)",
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
    batch: {
      supported: true,
      discount: 0.5,
      slaHours: 24,
      notes: "OpenAI Batch API supports /v1/images/generations — 50% off sync pricing. Submit as a .jsonl file.",
    },
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
        "Batch API (50% off)",
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
    batch: {
      supported: true,
      discount: 0.5,
      slaHours: 24,
      notes: "OpenAI Batch API supports /v1/images/generations — 50% off sync pricing. Submit as a .jsonl file.",
    },
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
        "Batch API (50% off)",
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
    batch: {
      supported: true,
      discount: 0.5,
      slaHours: 24,
      notes: "OpenAI Batch API supports /v1/images/generations — 50% off sync pricing. Submit as a .jsonl file.",
    },
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

export function priceFor(
  model: ModelKey,
  quality: Quality,
  aspect: AspectKey,
  opts: { batch?: boolean } = {},
): number | null {
  const entry = MODEL_BY_KEY[model];
  if (!entry) return null;
  const tier = entry.supportsQualityTiers ? entry.pricing[quality] : entry.pricing.flat;
  if (!tier) return null;
  const base = tier[aspect];
  if (opts.batch && entry.batch.supported) return base * (1 - entry.batch.discount);
  return base;
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
