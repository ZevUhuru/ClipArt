"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { STYLE_LABELS, VALID_STYLES, type StyleKey } from "@/lib/styles";

// ---------------------------------------------------------------------------
// Image models + single source of truth for pricing
// ---------------------------------------------------------------------------

const ALL_STYLES: StyleKey[] = [
  ...VALID_STYLES.clipart,
  ...VALID_STYLES.illustration.filter((s) => !VALID_STYLES.clipart.includes(s)),
  "coloring",
];

type ContentRole = "clipart" | "illustration" | "coloring" | "shared";

const STYLE_CONTENT_TYPE: Record<string, ContentRole> = {};
for (const s of VALID_STYLES.clipart) STYLE_CONTENT_TYPE[s] = "clipart";
for (const s of VALID_STYLES.illustration) {
  STYLE_CONTENT_TYPE[s] = STYLE_CONTENT_TYPE[s] ? "shared" : "illustration";
}
STYLE_CONTENT_TYPE["coloring"] = "coloring";

type AspectKey = "square" | "landscape" | "portrait";

const CONTENT_ROLE_ASPECT: Record<ContentRole, AspectKey> = {
  clipart: "square",
  illustration: "landscape",
  coloring: "portrait",
  // "shared" styles are most commonly used for clipart; pricing shown reflects that.
  shared: "square",
};

const ASPECT_LABEL: Record<AspectKey, { short: string; long: string; ratio: string }> = {
  square:    { short: "1:1",  long: "Square",    ratio: "1024×1024" },
  landscape: { short: "4:3",  long: "Landscape", ratio: "1536×1024" },
  portrait:  { short: "3:4",  long: "Portrait",  ratio: "1024×1536" },
};

type ModelKey = "gemini" | "gpt-image-1" | "gpt-image-2";

interface ModelMeta {
  value: ModelKey;
  label: string;
  provider: string;
  tagline: string;
  badge?: { label: string; tone: "indigo" | "purple" | "emerald" };
  capabilities: string[];
  pricing: Record<AspectKey, number>;
}

// Prices verified 2026-04-21 from developers.openai.com per-image calculator.
// All OpenAI entries use medium quality to match src/lib/gptImage1.ts and
// src/lib/gptImage2.ts (settled in CLAUDE.md).
const MODELS: ModelMeta[] = [
  {
    value: "gemini",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    tagline: "Clean vector clip art • cheapest default",
    capabilities: ["Batch API (50% off)", "Transparent BG", "Flat-price across ratios"],
    pricing: { square: 0.039, landscape: 0.039, portrait: 0.039 },
  },
  {
    value: "gpt-image-1",
    label: "GPT Image 1",
    provider: "OpenAI",
    tagline: "Richer textures • older model",
    capabilities: ["Transparent BG", "Image edits", "input_fidelity param"],
    pricing: { square: 0.042, landscape: 0.063, portrait: 0.063 },
  },
  {
    value: "gpt-image-2",
    label: "GPT Image 2",
    provider: "OpenAI",
    tagline: "State of the art • ChatGPT Images 2.0",
    badge: { label: "New · Apr 2026", tone: "indigo" },
    capabilities: ["Up to 2K", "In-image text", "Multilingual", "No transparent BG"],
    pricing: { square: 0.053, landscape: 0.041, portrait: 0.041 },
  },
];

const MODEL_BY_KEY: Record<ModelKey, ModelMeta> =
  Object.fromEntries(MODELS.map((m) => [m.value, m])) as Record<ModelKey, ModelMeta>;

// Coerce any unknown value (e.g. legacy "dalle" from a pre-migration DB row)
// back to a known ModelKey so the UI renders instead of crashing.
function normalizeModel(value: unknown): ModelKey {
  if (typeof value === "string" && value in MODEL_BY_KEY) return value as ModelKey;
  if (value === "dalle") return "gpt-image-1";
  return "gemini";
}

// Revenue per credit at the lowest tier ("Sweet Spot"/"Binge" packs = $0.05/credit).
// Used to sanity-check margin in the comparison chart.
const REVENUE_PER_CREDIT = 0.05;

// ---------------------------------------------------------------------------
// Text AI config — mirrors src/lib/textAI.ts registry
// ---------------------------------------------------------------------------

interface TextModel {
  id: string;
  provider: "gemini" | "openai" | "anthropic";
  label: string;
  costInput: string;
  costOutput: string;
}

const TEXT_MODELS: TextModel[] = [
  { id: "gemini-2.5-flash",           provider: "gemini",    label: "Gemini 2.5 Flash",  costInput: "$0.30",  costOutput: "$2.50"  },
  { id: "gpt-4.1-nano",               provider: "openai",    label: "GPT-4.1 Nano",      costInput: "$0.10",  costOutput: "$0.40"  },
  { id: "gpt-4o-mini",                provider: "openai",    label: "GPT-4o Mini",        costInput: "$0.15",  costOutput: "$0.60"  },
  { id: "gpt-4.1-mini",               provider: "openai",    label: "GPT-4.1 Mini",       costInput: "$0.40",  costOutput: "$1.60"  },
  { id: "claude-3-5-haiku-latest",    provider: "anthropic", label: "Claude 3.5 Haiku",   costInput: "$1.00",  costOutput: "$5.00"  },
  { id: "gpt-4.1",                    provider: "openai",    label: "GPT-4.1",            costInput: "$2.00",  costOutput: "$8.00"  },
  { id: "claude-sonnet-4-6",          provider: "anthropic", label: "Claude Sonnet 4.6",  costInput: "$3.00",  costOutput: "$15.00" },
];

type TextTask = "classification" | "seo_generation" | "animation_suggestions" | "prompt_polish";

const TASK_META: Record<TextTask, { label: string; description: string; hint: string; tooltip: string }> = {
  classification: {
    label: "Classification",
    description: "Assigns title, category, and slug to every generation",
    hint: "Runs on every image generation — optimize for cost",
    tooltip: "This model classifies every user-generated image by assigning a human-readable title, the best-matching category slug, an SEO description, and a URL slug. It runs on every single generation, so it is the highest-volume AI call. Choose a fast, cheap model — accuracy on structured JSON output matters more than creative quality.",
  },
  seo_generation: {
    label: "SEO Generation",
    description: "Creates h1, meta tags, intro, and prompts for category pages",
    hint: "Admin-only, runs when creating a category — optimize for quality",
    tooltip: "This model generates SEO content when you create a new category in the admin CMS: page heading, meta title/description, introductory copy, body paragraphs, and example prompts. It runs very rarely (only when an admin creates a category), so cost is negligible. Choose the highest-quality model for the best content.",
  },
  animation_suggestions: {
    label: "Animation Suggestions",
    description: "Analyzes source image to generate animation prompt ideas",
    hint: "User-facing, results are cached — vision model required",
    tooltip: "This model receives the user's source image and generates 5 creative animation prompt suggestions. It uses vision (image input) to understand the subject, pose, and scene. Results are cached per image, so each image only triggers one AI call. All models in this list support vision input.",
  },
  prompt_polish: {
    label: "Prompt Polish",
    description: "Refines rough user drafts into polished creation prompts",
    hint: "User-facing, runs on demand — optimize for creativity",
    tooltip: "This model takes a rough prompt draft built from the prompt builder chips and polishes it into 4 creative variations. It runs when a user clicks 'Polish with AI' on the create page. No vision required — text only. Choose a model that balances creativity with speed.",
  },
};

const TEXT_TASKS: TextTask[] = ["classification", "seo_generation", "animation_suggestions", "prompt_polish"];

type TextModelConfig = Record<TextTask, string>;
type ImageModelConfig = Record<string, ModelKey>;

// ---------------------------------------------------------------------------
// Helpers — rank a model's price against the column it competes in
// ---------------------------------------------------------------------------

function rankForAspect(aspect: AspectKey): Record<ModelKey, number> {
  const entries = MODELS
    .map((m) => ({ key: m.value, price: m.pricing[aspect] }))
    .sort((a, b) => a.price - b.price);
  const ranked = {} as Record<ModelKey, number>;
  entries.forEach((e, i) => { ranked[e.key] = i; });
  return ranked;
}

const RANK_BY_ASPECT: Record<AspectKey, Record<ModelKey, number>> = {
  square:    rankForAspect("square"),
  landscape: rankForAspect("landscape"),
  portrait:  rankForAspect("portrait"),
};

function rankTone(rank: number): { bg: string; text: string; ring: string } {
  if (rank === 0) return { bg: "bg-emerald-50",  text: "text-emerald-700", ring: "ring-emerald-200" };
  if (rank === 1) return { bg: "bg-amber-50",    text: "text-amber-700",   ring: "ring-amber-200" };
  return                { bg: "bg-rose-50",      text: "text-rose-700",    ring: "ring-rose-200" };
}

function percentVsCheapest(model: ModelKey, aspect: AspectKey): number {
  const cheapest = Math.min(...MODELS.map((m) => m.pricing[aspect]));
  return Math.round(((MODEL_BY_KEY[model].pricing[aspect] - cheapest) / cheapest) * 100);
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(3)}`;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 transition-colors hover:bg-gray-300 hover:text-gray-700"
        aria-label="More information"
      >
        i
      </button>
      {show && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg">
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gray-200 bg-white" />
          {text}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  tooltip,
  right,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tooltip?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            {eyebrow}
          </span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-gray-500">{description}</p>
      </div>
      {right}
    </div>
  );
}

function CapabilityChip({ label }: { label: string }) {
  const negative = label.toLowerCase().startsWith("no ");
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
        negative
          ? "bg-gray-50 text-gray-400 ring-gray-200"
          : "bg-white text-gray-600 ring-gray-200"
      }`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pricing comparison chart (the new focal component)
// ---------------------------------------------------------------------------

function PricingMatrix() {
  const aspectKeys: AspectKey[] = ["square", "landscape", "portrait"];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Chart header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-6 py-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Pricing comparison — per image, medium quality
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Cheapest option per aspect ratio highlighted in green. All OpenAI calls pinned to medium quality.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Cheapest
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Mid
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Highest
          </span>
        </div>
      </div>

      {/* Matrix */}
      <div className="grid grid-cols-[minmax(220px,1fr)_repeat(3,minmax(0,1fr))] text-sm">
        {/* Column headers */}
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3" />
        {aspectKeys.map((aspect) => (
          <div
            key={aspect}
            className="border-b border-l border-gray-100 bg-gray-50/60 px-5 py-3"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {ASPECT_LABEL[aspect].long}
              </span>
              <span className="text-[10px] text-gray-400">{ASPECT_LABEL[aspect].short}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-gray-400">
              {ASPECT_LABEL[aspect].ratio} ·{" "}
              {aspect === "square"
                ? "clipart"
                : aspect === "landscape"
                  ? "illustrations"
                  : "coloring pages"}
            </div>
          </div>
        ))}

        {/* Rows */}
        {MODELS.map((model, idx) => (
          <div key={model.value} className="contents">
            {/* Model label cell */}
            <div
              className={`px-5 py-4 ${
                idx < MODELS.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{model.label}</span>
                {model.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      model.badge.tone === "indigo"
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                        : model.badge.tone === "purple"
                          ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    }`}
                  >
                    {model.badge.label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {model.provider} · {model.tagline}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {model.capabilities.map((c) => (
                  <CapabilityChip key={c} label={c} />
                ))}
              </div>
            </div>

            {/* Price cells */}
            {aspectKeys.map((aspect) => {
              const rank = RANK_BY_ASPECT[aspect][model.value];
              const tone = rankTone(rank);
              const diff = percentVsCheapest(model.value, aspect);
              const revenueMarginPct = Math.round(
                ((REVENUE_PER_CREDIT - model.pricing[aspect]) / REVENUE_PER_CREDIT) * 100,
              );
              return (
                <div
                  key={aspect}
                  className={`border-l border-gray-100 px-5 py-4 ${
                    idx < MODELS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div
                    className={`inline-flex items-baseline gap-2 rounded-lg px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
                  >
                    {fmtUsd(model.pricing[aspect])}
                    {rank === 0 && (
                      <span aria-hidden className="text-emerald-500">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[11px] text-gray-400">
                    {diff === 0 ? "cheapest" : `+${diff}% vs cheapest`}
                  </div>
                  <div
                    className={`text-[11px] ${
                      revenueMarginPct < 0
                        ? "text-rose-500"
                        : revenueMarginPct < 20
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {revenueMarginPct >= 0 ? "+" : ""}
                    {revenueMarginPct}% margin @ $0.05/credit
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3 text-[11px] text-gray-500">
        <span>
          Source: <code className="rounded bg-white px-1 py-0.5 text-gray-600">developers.openai.com</code>{" "}
          per-image calculator · verified 2026-04-21.
        </span>
        <span className="text-gray-400">
          Margin figure assumes lowest pack tier ($0.05/credit). Each image = 1 credit to the user.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost pill used in the per-style routing table
// ---------------------------------------------------------------------------

function CostPill({ model, aspect }: { model: ModelKey; aspect: AspectKey }) {
  const rank = RANK_BY_ASPECT[aspect][model];
  const tone = rankTone(rank);
  const price = MODEL_BY_KEY[model].pricing[aspect];
  const diff = percentVsCheapest(model, aspect);
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
      >
        {fmtUsd(price)}
        {rank === 0 && <span aria-hidden>✓</span>}
      </span>
      <span className="text-[11px] text-gray-400">
        {diff === 0 ? "best" : `+${diff}%`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style role pill (the small badge next to each style name)
// ---------------------------------------------------------------------------

function RolePill({ role }: { role: ContentRole }) {
  const config: Record<ContentRole, { label: string; cls: string }> = {
    clipart:      { label: "clipart",      cls: "bg-gray-100 text-gray-600 ring-gray-200" },
    illustration: { label: "illustration", cls: "bg-purple-50 text-purple-700 ring-purple-200" },
    coloring:     { label: "coloring",     cls: "bg-blue-50 text-blue-700 ring-blue-200" },
    shared:       { label: "shared",       cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  };
  const c = config[role];
  return (
    <span
      className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Provider key detection (passed from API check)
// ---------------------------------------------------------------------------

function getProviderAvailability(): Record<string, boolean> {
  return { gemini: true, openai: true, anthropic: true };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminModelsPage() {
  const [imageConfig, setImageConfig] = useState<ImageModelConfig | null>(null);
  const [initialImageConfig, setInitialImageConfig] = useState<string>("");
  const [textConfig, setTextConfig] = useState<TextModelConfig | null>(null);
  const [initialTextConfig, setInitialTextConfig] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings/model-config").then((r) => r.json()),
      fetch("/api/admin/settings/text-model-config").then((r) => r.json()),
      fetch("/api/admin/settings/text-model-config/keys").then((r) => r.json()).catch(() => getProviderAvailability()),
    ])
      .then(([img, txt, keys]) => {
        setImageConfig(img);
        setInitialImageConfig(JSON.stringify(img));
        setTextConfig(txt);
        setInitialTextConfig(JSON.stringify(txt));
        setApiKeys(keys);
      })
      .catch(() => setError("Failed to load model config"));
  }, []);

  const dirty = useMemo(() => {
    if (!imageConfig || !textConfig) return false;
    return (
      JSON.stringify(imageConfig) !== initialImageConfig ||
      JSON.stringify(textConfig) !== initialTextConfig
    );
  }, [imageConfig, textConfig, initialImageConfig, initialTextConfig]);

  // Aggregate: how many styles are routed to each model?
  const modelDistribution = useMemo(() => {
    if (!imageConfig) return {} as Record<ModelKey, number>;
    const out = { gemini: 0, "gpt-image-1": 0, "gpt-image-2": 0 } as Record<ModelKey, number>;
    for (const style of ALL_STYLES) {
      const m = normalizeModel(imageConfig[style]);
      out[m] = (out[m] ?? 0) + 1;
    }
    return out;
  }, [imageConfig]);

  async function handleSave() {
    if (!imageConfig || !textConfig) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const [imgRes, txtRes] = await Promise.all([
        fetch("/api/admin/settings/model-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imageConfig),
        }),
        fetch("/api/admin/settings/text-model-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(textConfig),
        }),
      ]);

      if (!imgRes.ok) {
        const data = await imgRes.json();
        throw new Error(data.error || "Failed to save image config");
      }
      if (!txtRes.ok) {
        const data = await txtRes.json();
        throw new Error(data.error || "Failed to save text config");
      }

      setInitialImageConfig(JSON.stringify(imageConfig));
      setInitialTextConfig(JSON.stringify(textConfig));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!imageConfig || !textConfig) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  const keys = apiKeys || getProviderAvailability();

  return (
    <div className="pb-16">
      {/* ─── Page header ─── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Admin · Infrastructure
          </span>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Model Configuration</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Control which AI models power image generation and text intelligence across clip.art.
            Changes take effect within 60 seconds (config cache TTL).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          ) : saved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Saved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              In sync
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ─── IMAGE GENERATION ─── */}
      <section className="mb-14">
        <SectionHeader
          eyebrow="Image Generation"
          title="Model routing per style"
          description="Each generation style can use a different engine. Pricing is aspect-ratio-aware — clipart renders at 1:1, illustrations at 4:3, coloring pages at 3:4."
          tooltip="All styles cost 1 credit to the user regardless of which model is selected. Admin changes here propagate to the generation pipeline within 60 seconds."
          right={
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              {MODELS.map((m) => (
                <span
                  key={m.value}
                  className="rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200"
                >
                  <span className="font-semibold text-gray-700">
                    {modelDistribution[m.value] ?? 0}
                  </span>
                  <span className="ml-1 text-gray-400">{m.label}</span>
                </span>
              ))}
            </div>
          }
        />

        {/* Pricing comparison chart */}
        <PricingMatrix />

        {/* Style routing table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-6 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Style → Model routing</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {ALL_STYLES.length} styles · cost pill color encodes rank within the style's aspect ratio.
              </p>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Style
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Aspect
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Cost per image
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ALL_STYLES.map((style) => {
                const role = STYLE_CONTENT_TYPE[style] || "clipart";
                const aspect = CONTENT_ROLE_ASPECT[role];
                const selected = normalizeModel(imageConfig[style]);
                return (
                  <tr key={style} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {STYLE_LABELS[style] || style}
                        </span>
                        <RolePill role={role} />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      <span className="font-mono">{ASPECT_LABEL[aspect].short}</span>
                      <span className="ml-1.5 text-gray-400">· {ASPECT_LABEL[aspect].ratio}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <select
                        value={selected}
                        onChange={(e) =>
                          setImageConfig((prev) => ({
                            ...prev!,
                            [style]: e.target.value as ModelKey,
                          }))
                        }
                        className="w-full max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        {MODELS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3.5">
                      <CostPill model={selected} aspect={aspect} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── TEXT AI ─── */}
      <section>
        <SectionHeader
          eyebrow="Text AI"
          title="Task routing per job"
          description="Each task can use a different language model so you can optimize cost for high-volume jobs and quality for low-volume ones."
          tooltip="Config is cached for 60 seconds. High-volume tasks (classification) run on every image generation — prioritize cost. Low-volume tasks (SEO generation) run rarely — prioritize quality."
        />

        <div className="space-y-3">
          {TEXT_TASKS.map((task) => {
            const meta = TASK_META[task];
            const selectedId = textConfig[task] || "gemini-2.5-flash";
            const selectedModel = TEXT_MODELS.find((m) => m.id === selectedId);

            return (
              <div
                key={task}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{meta.label}</h3>
                      <InfoTooltip text={meta.tooltip} />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{meta.description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{meta.hint}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <select
                      value={selectedId}
                      onChange={(e) =>
                        setTextConfig((prev) => ({ ...prev!, [task]: e.target.value }))
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      {TEXT_MODELS.map((m) => {
                        const providerAvailable = keys[m.provider] !== false;
                        return (
                          <option key={m.id} value={m.id} disabled={!providerAvailable}>
                            {m.label}
                            {!providerAvailable ? " (key missing)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {selectedModel && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
                        {selectedModel.costInput} in · {selectedModel.costOutput} out / 1M
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          Cost shown is input/output per 1M tokens. Claude requires{" "}
          <code className="rounded bg-white px-1 py-0.5 text-gray-600 ring-1 ring-inset ring-gray-200">
            ANTHROPIC_API_KEY
          </code>
          ; GPT requires{" "}
          <code className="rounded bg-white px-1 py-0.5 text-gray-600 ring-1 ring-inset ring-gray-200">
            OPENAI_API_KEY
          </code>
          .
        </div>
      </section>
    </div>
  );
}
