import { generateClipArt } from "./gemini";
import { generateWithDallE } from "./dalle";
import { type StyleKey, type ModelKey, type ContentType, STYLE_MODEL_MAP, CONTENT_TYPE_ASPECT, buildPrompt } from "./styles";
import { createSupabaseAdmin } from "./supabase/server";

let _cachedConfig: Record<string, string> | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function getModelConfig(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (_cachedConfig && now - _cacheTime < CACHE_TTL_MS) return _cachedConfig;

  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "model_config")
      .single();

    if (data?.value) {
      _cachedConfig = data.value as Record<string, string>;
      _cacheTime = now;
      return _cachedConfig;
    }
  } catch {
    // Table may not exist yet — fall through to code defaults
  }

  return null;
}

async function resolveModel(style: StyleKey): Promise<ModelKey> {
  const dbConfig = await getModelConfig();
  if (dbConfig && dbConfig[style]) {
    const model = dbConfig[style];
    if (model === "gemini" || model === "dalle") return model;
  }
  return STYLE_MODEL_MAP[style];
}

export async function generateImage(
  userPrompt: string,
  style: StyleKey,
  contentType: ContentType = "clipart",
  aspectRatioOverride?: string,
): Promise<{ buffer: Buffer; model: ModelKey }> {
  const model = await resolveModel(style);
  const prompt = buildPrompt(userPrompt, style, contentType);
  const aspectRatio = aspectRatioOverride || CONTENT_TYPE_ASPECT[contentType] || "1:1";

  let buffer: Buffer;
  switch (model) {
    case "dalle":
      buffer = await generateWithDallE(prompt, aspectRatio);
      break;
    case "gemini":
    default:
      buffer = await generateClipArt(prompt, aspectRatio);
  }

  return { buffer, model };
}
