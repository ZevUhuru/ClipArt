import { generateClipArt } from "./gemini";
import { generateWithGptImage1, type GptImageQuality } from "./gptImage1";
import { generateWithGptImage15 } from "./gptImage15";
import { generateWithGptImage2 } from "./gptImage2";
import { type StyleKey, type ModelKey, type ContentType, STYLE_MODEL_MAP, CONTENT_TYPE_ASPECT, buildPrompt } from "./styles";
import { createSupabaseAdmin } from "./supabase/server";

let _cachedModelConfig: Record<string, string> | null = null;
let _cachedQualityConfig: Record<string, string> | null = null;
let _modelCacheTime = 0;
let _qualityCacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function readSetting(key: "model_config" | "model_quality_config"): Promise<Record<string, string> | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (data?.value) return data.value as Record<string, string>;
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
    _cachedModelConfig = value;
    _modelCacheTime = now;
  }
  return _cachedModelConfig;
}

async function getQualityConfig(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (_cachedQualityConfig && now - _qualityCacheTime < CACHE_TTL_MS) return _cachedQualityConfig;
  const value = await readSetting("model_quality_config");
  if (value) {
    _cachedQualityConfig = value;
    _qualityCacheTime = now;
  }
  return _cachedQualityConfig;
}

const VALID_MODELS: ReadonlySet<ModelKey> = new Set(["gemini", "gpt-image-1", "gpt-image-1.5", "gpt-image-2"]);
const VALID_QUALITIES: ReadonlySet<GptImageQuality> = new Set(["low", "medium", "high"]);

async function resolveModel(style: StyleKey): Promise<ModelKey> {
  const dbConfig = await getModelConfig();
  if (dbConfig && dbConfig[style]) {
    const model = dbConfig[style] as ModelKey;
    if (VALID_MODELS.has(model)) return model;
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

export async function generateImage(
  userPrompt: string,
  style: StyleKey,
  contentType: ContentType = "clipart",
  aspectRatioOverride?: string,
): Promise<{ buffer: Buffer; model: ModelKey; quality: GptImageQuality }> {
  const [model, quality] = await Promise.all([resolveModel(style), resolveQuality(style)]);
  const prompt = buildPrompt(userPrompt, style, contentType);
  const aspectRatio = aspectRatioOverride || CONTENT_TYPE_ASPECT[contentType] || "1:1";

  let buffer: Buffer;
  switch (model) {
    case "gpt-image-1":
      buffer = await generateWithGptImage1(prompt, aspectRatio, quality);
      break;
    case "gpt-image-1.5":
      buffer = await generateWithGptImage15(prompt, aspectRatio, quality);
      break;
    case "gpt-image-2":
      buffer = await generateWithGptImage2(prompt, aspectRatio, quality);
      break;
    case "gemini":
    default:
      buffer = await generateClipArt(prompt, aspectRatio);
  }

  return { buffer, model, quality };
}
