import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "./supabase/server";

// ---------------------------------------------------------------------------
// Task types
// ---------------------------------------------------------------------------

export type TextTask = "classification" | "seo_generation" | "animation_suggestions";

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

export interface TextModel {
  id: string;
  provider: "gemini" | "openai" | "anthropic";
  label: string;
  costInput: string;
  costOutput: string;
  vision: boolean;
}

export const TEXT_MODELS: TextModel[] = [
  { id: "gemini-2.5-flash",              provider: "gemini",    label: "Gemini 2.5 Flash",    costInput: "$0.30",  costOutput: "$2.50",  vision: true },
  { id: "gpt-4.1-nano",                  provider: "openai",    label: "GPT-4.1 Nano",        costInput: "$0.10",  costOutput: "$0.40",  vision: true },
  { id: "gpt-4o-mini",                   provider: "openai",    label: "GPT-4o Mini",          costInput: "$0.15",  costOutput: "$0.60",  vision: true },
  { id: "gpt-4.1-mini",                  provider: "openai",    label: "GPT-4.1 Mini",         costInput: "$0.40",  costOutput: "$1.60",  vision: true },
  { id: "claude-3-5-haiku-latest",       provider: "anthropic", label: "Claude 3.5 Haiku",     costInput: "$1.00",  costOutput: "$5.00",  vision: true },
  { id: "gpt-4.1",                       provider: "openai",    label: "GPT-4.1",              costInput: "$2.00",  costOutput: "$8.00",  vision: true },
  { id: "claude-sonnet-4-6-20250514",    provider: "anthropic", label: "Claude Sonnet 4.6",    costInput: "$3.00",  costOutput: "$15.00", vision: true },
];

export const TEXT_MODEL_IDS = new Set(TEXT_MODELS.map((m) => m.id));

const DEFAULT_MODELS: Record<TextTask, string> = {
  classification: "gemini-2.5-flash",
  seo_generation: "gemini-2.5-flash",
  animation_suggestions: "gemini-2.5-flash",
};

export const TASK_META: Record<TextTask, { label: string; description: string; hint: string }> = {
  classification: {
    label: "Classification",
    description: "Assigns title, category, and slug to every generation",
    hint: "Runs on every image generation — optimize for cost",
  },
  seo_generation: {
    label: "SEO Generation",
    description: "Creates h1, meta tags, intro, and prompts for category pages",
    hint: "Admin-only, runs when creating a category — optimize for quality",
  },
  animation_suggestions: {
    label: "Animation Suggestions",
    description: "Analyzes source image to generate animation prompt ideas",
    hint: "User-facing, results are cached — vision model required",
  },
};

// ---------------------------------------------------------------------------
// SDK singletons
// ---------------------------------------------------------------------------

let _gemini: InstanceType<typeof GoogleGenAI> | null = null;
function getGemini() {
  if (!_gemini) _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _gemini;
}

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return _openai;
}

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _anthropic;
}

// ---------------------------------------------------------------------------
// Config cache (mirrors imageGen.ts pattern)
// ---------------------------------------------------------------------------

let _cachedConfig: Record<string, string> | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function getTextModelConfig(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_cachedConfig && now - _cacheTime < CACHE_TTL_MS) return _cachedConfig;

  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "text_model_config")
      .single();

    if (data?.value && typeof data.value === "object") {
      _cachedConfig = data.value as Record<string, string>;
      _cacheTime = now;
      return _cachedConfig;
    }
  } catch {
    // Table/key may not exist yet
  }

  return DEFAULT_MODELS;
}

function resolveModel(task: TextTask, config: Record<string, string>): TextModel {
  const modelId = config[task] || DEFAULT_MODELS[task];
  const model = TEXT_MODELS.find((m) => m.id === modelId);
  return model || TEXT_MODELS[0]; // fallback to Gemini 2.5 Flash
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TextAIOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function generateText(
  task: TextTask,
  systemPrompt: string,
  userContent: string,
  options: TextAIOptions = {},
): Promise<string> {
  const config = await getTextModelConfig();
  const model = resolveModel(task, config);
  const temp = options.temperature ?? 0.1;
  const maxTokens = options.maxTokens ?? 2048;

  switch (model.provider) {
    case "gemini":
      return callGemini(model.id, systemPrompt, userContent, temp);
    case "openai":
      return callOpenAI(model.id, systemPrompt, userContent, temp, maxTokens);
    case "anthropic":
      return callAnthropic(model.id, systemPrompt, userContent, temp, maxTokens);
  }
}

export async function generateTextWithVision(
  task: TextTask,
  systemPrompt: string,
  userContent: string,
  imageData: { base64: string; mimeType: string },
  options: TextAIOptions = {},
): Promise<string> {
  const config = await getTextModelConfig();
  const model = resolveModel(task, config);
  const temp = options.temperature ?? 0.9;
  const maxTokens = options.maxTokens ?? 4096;

  switch (model.provider) {
    case "gemini":
      return callGeminiVision(model.id, systemPrompt, userContent, imageData, temp);
    case "openai":
      return callOpenAIVision(model.id, systemPrompt, userContent, imageData, temp, maxTokens);
    case "anthropic":
      return callAnthropicVision(model.id, systemPrompt, userContent, imageData, temp, maxTokens);
  }
}

// ---------------------------------------------------------------------------
// Provider implementations — text only
// ---------------------------------------------------------------------------

async function callGemini(
  modelId: string,
  systemPrompt: string,
  userContent: string,
  temperature: number,
): Promise<string> {
  const response = await getGemini().models.generateContent({
    model: modelId,
    contents: userContent,
    config: {
      systemInstruction: systemPrompt,
      temperature,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (!part || !("text" in part) || !part.text) throw new Error("Empty Gemini response");
  return part.text;
}

async function callOpenAI(
  modelId: string,
  systemPrompt: string,
  userContent: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const res = await getOpenAI().chat.completions.create({
    model: modelId,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

async function callAnthropic(
  modelId: string,
  systemPrompt: string,
  userContent: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const res = await getAnthropic().messages.create({
    model: modelId,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("Empty Anthropic response");
  return block.text;
}

// ---------------------------------------------------------------------------
// Provider implementations — vision
// ---------------------------------------------------------------------------

async function callGeminiVision(
  modelId: string,
  systemPrompt: string,
  userContent: string,
  imageData: { base64: string; mimeType: string },
  temperature: number,
): Promise<string> {
  const response = await getGemini().models.generateContent({
    model: modelId,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
          { text: userContent },
        ],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      temperature,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (!part || !("text" in part) || !part.text) throw new Error("Empty Gemini vision response");
  return part.text;
}

async function callOpenAIVision(
  modelId: string,
  systemPrompt: string,
  userContent: string,
  imageData: { base64: string; mimeType: string },
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const res = await getOpenAI().chat.completions.create({
    model: modelId,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` } },
          { type: "text", text: userContent },
        ],
      },
    ],
  });

  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("Empty OpenAI vision response");
  return text;
}

async function callAnthropicVision(
  modelId: string,
  systemPrompt: string,
  userContent: string,
  imageData: { base64: string; mimeType: string },
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const mediaType = imageData.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const res = await getAnthropic().messages.create({
    model: modelId,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageData.base64 } },
          { type: "text", text: userContent },
        ],
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("Empty Anthropic vision response");
  return block.text;
}
