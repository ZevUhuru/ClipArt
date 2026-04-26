import { generateClipArt } from "./gemini";
import { generateWithGeminiPro } from "./geminiPro";
import { generateWithGptImage1, type GptImageQuality } from "./gptImage1";
import { generateWithGptImage15 } from "./gptImage15";
import { generateWithGptImage2 } from "./gptImage2";
import { type StyleKey, type ModelKey, type ContentType, STYLE_MODEL_MAP, CONTENT_TYPE_ASPECT, CONTENT_TYPE_MODEL_OVERRIDE, buildPrompt } from "./styles";
import { createSupabaseAdmin } from "./supabase/server";

import { DEFAULT_BG_REMOVAL_MODEL_ID } from "./bgRemovalCatalog";

let _cachedModelConfig: Record<string, string> | null = null;
let _cachedQualityConfig: Record<string, string> | null = null;
let _cachedBgRemovalConfig: BgRemovalConfig | null = null;
let _modelCacheTime = 0;
let _qualityCacheTime = 0;
let _bgRemovalCacheTime = 0;
const CACHE_TTL_MS = 60_000;

export interface BgRemovalConfig {
  enabled: boolean;
  modelId: string;
}

async function readSetting(key: "model_config" | "model_quality_config" | "bg_removal_config"): Promise<Record<string, unknown> | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (data?.value) return data.value as Record<string, unknown>;
  } catch {
    // Table may not exist yet — fall through to defaults.
  }
  return null;
}

async function getModelConfig(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (_cachedModelConfig && now - _modelCacheTime < CACHE_TTL_MS) return _cachedModelConfig;
  const value = await readSetting("model_config");
  if (value) {
    _cachedModelConfig = value as Record<string, string>;
    _modelCacheTime = now;
  }
  return _cachedModelConfig;
}

async function getQualityConfig(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (_cachedQualityConfig && now - _qualityCacheTime < CACHE_TTL_MS) return _cachedQualityConfig;
  const value = await readSetting("model_quality_config");
  if (value) {
    _cachedQualityConfig = value as Record<string, string>;
    _qualityCacheTime = now;
  }
  return _cachedQualityConfig;
}

export async function getBgRemovalConfig(): Promise<BgRemovalConfig> {
  const now = Date.now();
  if (_cachedBgRemovalConfig && now - _bgRemovalCacheTime < CACHE_TTL_MS) {
    return _cachedBgRemovalConfig;
  }
  const value = await readSetting("bg_removal_config");
  _cachedBgRemovalConfig = {
    enabled: value ? (value.enabled as boolean) : true,
    modelId: (value?.modelId as string) || DEFAULT_BG_REMOVAL_MODEL_ID,
  };
  _bgRemovalCacheTime = now;
  return _cachedBgRemovalConfig;
}

const VALID_MODELS: ReadonlySet<ModelKey> = new Set(["gemini", "gemini-pro", "gpt-image-1", "gpt-image-1.5", "gpt-image-2"]);
const VALID_QUALITIES: ReadonlySet<GptImageQuality> = new Set(["low", "medium", "high"]);

async function resolveModel(style: StyleKey, contentType: ContentType): Promise<ModelKey> {
  const override = CONTENT_TYPE_MODEL_OVERRIDE[contentType];
  if (override) return override;

  const dbConfig = await getModelConfig();
  if (dbConfig) {
    // Prefer content-type-specific composite key (e.g. "clipart:flat") over
    // legacy style-only key ("flat"). Composite keys are written by the admin UI;
    // style-only keys are backward-compat fallbacks for configs saved before
    // per-content-type routing was added.
    const compositeKey = `${contentType}:${style}`;
    if (dbConfig[compositeKey]) {
      const model = dbConfig[compositeKey] as ModelKey;
      if (VALID_MODELS.has(model)) return model;
    }
    if (dbConfig[style]) {
      const model = dbConfig[style] as ModelKey;
      if (VALID_MODELS.has(model)) return model;
    }
  }
  return STYLE_MODEL_MAP[style];
}

async function resolveQuality(style: StyleKey): Promise<GptImageQuality> {
  const dbConfig = await getQualityConfig();
  if (dbConfig && dbConfig[style]) {
    const q = dbConfig[style] as GptImageQuality;
    if (VALID_QUALITIES.has(q)) return q;
  }
  return "medium";
}

export interface GenerateImageResult {
  buffer: Buffer;
  model: ModelKey;
  quality: GptImageQuality;
  /** True when the image was generated with a native transparent background. */
  hasTransparency: boolean;
  /**
   * True when the image is clipart generated with a model that does NOT
   * support native transparency (e.g. gpt-image-2). The caller should run
   * post-processing background removal and set has_transparency = true after.
   */
  needsBgRemoval: boolean;
}

export async function generateImage(
  userPrompt: string,
  style: StyleKey,
  contentType: ContentType = "clipart",
  aspectRatioOverride?: string,
): Promise<GenerateImageResult> {
  const [model, quality] = await Promise.all([resolveModel(style, contentType), resolveQuality(style)]);
  const prompt = buildPrompt(userPrompt, style, contentType);
  const aspectRatio = aspectRatioOverride || CONTENT_TYPE_ASPECT[contentType] || "1:1";

  // Only gpt-image-1.5 supports transparent backgrounds via the API param.
  // gpt-image-2 rejects background: "transparent" with a 400.
  const background = (contentType === "clipart" && model === "gpt-image-1.5") ? "transparent" : "auto";
  const hasTransparency = background === "transparent";

  // gpt-image-2 and gpt-image-1 produce white-bg PNG for clipart — flag them
  // for post-processing background removal via fal.ai BiRefNet.
  const needsBgRemoval =
    contentType === "clipart" &&
    !hasTransparency &&
    (model === "gpt-image-2" || model === "gpt-image-1");

  let buffer: Buffer;
  switch (model) {
    case "gpt-image-1":
      buffer = await generateWithGptImage1(prompt, aspectRatio, quality, background);
      break;
    case "gpt-image-1.5":
      buffer = await generateWithGptImage15(prompt, aspectRatio, quality, background);
      break;
    case "gpt-image-2":
      buffer = await generateWithGptImage2(prompt, aspectRatio, quality, background);
      break;
    case "gemini-pro":
      buffer = await generateWithGeminiPro(prompt, aspectRatio);
      break;
    case "gemini":
    default:
      buffer = await generateClipArt(prompt, aspectRatio);
  }

  return { buffer, model, quality, hasTransparency, needsBgRemoval };
}
