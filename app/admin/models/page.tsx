"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BG_REMOVAL_CATALOG, BG_REMOVAL_CATALOG_BY_ID, DEFAULT_BG_REMOVAL_MODEL_ID } from "@/lib/bgRemovalCatalog";
import { STYLE_LABELS, VALID_STYLES, STYLE_MODEL_MAP, type StyleKey, type ModelKey } from "@/lib/styles";
import {
  IMAGE_MODELS,
  MODEL_BY_KEY,
  REVENUE_PER_CREDIT,
  ASPECT_INFO,
  priceFor,
  normalizeModelKey,
  normalizeQuality,
  type AspectKey,
  type Quality,
} from "@/lib/imageModelCatalog";

// ---------------------------------------------------------------------------
// Content-type routing — decoupled per content type
// ---------------------------------------------------------------------------

// Routing config is keyed by "contentType:style" composite strings so that
// shared styles (flat, cartoon, etc.) can have different models for clipart
// vs illustration. Legacy style-only keys ("flat") still work as fallbacks
// in imageGen.ts but are no longer written by the admin UI.

type RoutingContentType = "clipart" | "illustration" | "coloring";

const ROUTING_CONTENT_TYPES: RoutingContentType[] = ["clipart", "illustration", "coloring"];

const CONTENT_TYPE_ASPECT: Record<RoutingContentType, AspectKey> = {
  clipart: "square",
  illustration: "landscape",
  coloring: "portrait",
};

const CONTENT_TYPE_LABELS: Record<RoutingContentType, string> = {
  clipart: "Clip Art",
  illustration: "Illustration",
  coloring: "Coloring",
};

// Build composite key: "clipart:flat"
function ck(ct: RoutingContentType, style: StyleKey): string {
  return `${ct}:${style}`;
}

// Normalize a raw config (may have legacy style-only keys or new composite keys)
// into a fully-populated composite-key config. Called once on load.
function normalizeToComposite(
  rawModel: Record<string, string>,
  rawQuality: Record<string, string>,
): { model: ImageModelConfig; quality: QualityConfig } {
  const model: ImageModelConfig = {};
  const quality: QualityConfig = {};

  for (const ct of ROUTING_CONTENT_TYPES) {
    for (const style of VALID_STYLES[ct] as StyleKey[]) {
      const key = ck(ct, style);
      // Composite key takes priority, then legacy style-only key, then hardcoded default
      model[key] = normalizeModelKey(rawModel[key] ?? rawModel[style] ?? STYLE_MODEL_MAP[style] ?? "gemini");
      quality[key] = normalizeQuality(rawQuality[key] ?? rawQuality[style]);
    }
  }

  return { model, quality };
}

// ---------------------------------------------------------------------------
// Text AI registry (unchanged)
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
type QualityConfig = Record<string, Quality>;

// ---------------------------------------------------------------------------
// Ranking helpers — color-code price cells by rank within their (aspect × quality)
// competitive slot. Gemini (flat price) competes at all quality tiers.
// ---------------------------------------------------------------------------

function rankAt(aspect: AspectKey, quality: Quality, batch = false): Record<ModelKey, number> {
  const entries = IMAGE_MODELS
    .map((m) => ({ key: m.key, price: priceFor(m.key, quality, aspect, { batch }) ?? Infinity }))
    .filter((e) => Number.isFinite(e.price))
    .sort((a, b) => a.price - b.price);
  const out = {} as Record<ModelKey, number>;
  entries.forEach((e, i) => { out[e.key] = i; });
  return out;
}

function toneForRank(rank: number) {
  if (rank === 0) return { bg: "bg-emerald-50",  text: "text-emerald-700", ring: "ring-emerald-200" };
  if (rank === 1) return { bg: "bg-amber-50",    text: "text-amber-700",   ring: "ring-amber-200" };
  return                { bg: "bg-rose-50",      text: "text-rose-700",    ring: "ring-rose-200" };
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(3)}`;
}

// Format very small numbers with 4 decimals so batch prices like $0.0195
// don't round to $0.020 and lose precision in the comparison matrix.
function fmtUsdPrecise(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
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

function CapabilityChip({ label, negative = false }: { label: string; negative?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
        negative
          ? "bg-gray-50 text-gray-400 ring-gray-200"
          : "bg-white text-gray-600 ring-gray-200"
      }`}
    >
      {negative ? `no ${label.replace(/^No /i, "")}` : label}
    </span>
  );
}

function ModelBadge({ model }: { model: ModelKey }) {
  const meta = MODEL_BY_KEY[model];
  if (!meta.badge) return null;
  const toneMap = {
    indigo:  "bg-indigo-50 text-indigo-700 ring-indigo-200",
    purple:  "bg-purple-50 text-purple-700 ring-purple-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    gray:    "bg-gray-50 text-gray-500 ring-gray-200",
  } as const;
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${toneMap[meta.badge.tone]}`}
    >
      {meta.badge.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pricing comparison — full matrix (every quality × every aspect)
// ---------------------------------------------------------------------------

const ASPECT_KEYS: AspectKey[] = ["square", "landscape", "portrait"];
const QUALITY_ROWS: Quality[] = ["low", "medium", "high"];

function PricingMatrix() {
  const [mode, setMode] = useState<"sync" | "batch">("sync");
  const batch = mode === "batch";

  const rankByCell = useMemo(() => {
    const map: Record<Quality, Record<AspectKey, Record<ModelKey, number>>> = {
      low:    { square: {}, landscape: {}, portrait: {} } as Record<AspectKey, Record<ModelKey, number>>,
      medium: { square: {}, landscape: {}, portrait: {} } as Record<AspectKey, Record<ModelKey, number>>,
      high:   { square: {}, landscape: {}, portrait: {} } as Record<AspectKey, Record<ModelKey, number>>,
      flat:   { square: {}, landscape: {}, portrait: {} } as Record<AspectKey, Record<ModelKey, number>>,
    };
    for (const q of QUALITY_ROWS) {
      for (const a of ASPECT_KEYS) {
        map[q][a] = rankAt(a, q, batch);
      }
    }
    map.flat.square = rankAt("square", "flat", batch);
    map.flat.landscape = rankAt("landscape", "flat", batch);
    map.flat.portrait = rankAt("portrait", "flat", batch);
    return map;
  }, [batch]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-6 py-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Pricing comparison — all quality tiers × all aspect ratios
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Per-image cost. Cheapest per (quality × aspect) slot in green. Toggle Batch
            for 50%-off async pricing (24h completion window). Click a model name for full details.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Sync / Batch toggle */}
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="tablist" aria-label="Pricing mode">
            <button
              type="button"
              role="tab"
              aria-selected={!batch}
              onClick={() => setMode("sync")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                !batch
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sync
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={batch}
              onClick={() => setMode("batch")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                batch
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Batch <span className="ml-1 text-[10px] text-emerald-600">−50%</span>
            </button>
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
      </div>

      {batch && (
        <div className="border-b border-emerald-100 bg-emerald-50/60 px-6 py-2.5 text-[11px] text-emerald-700">
          <strong>Batch mode</strong> — 50% discount, 24-hour completion window. Both OpenAI
          (<code className="rounded bg-white px-1 py-0.5 text-emerald-800">/v1/images/generations</code>)
          and Gemini support batch; not usable for user-facing real-time generation. Best
          for scripted seeding runs.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Model
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Quality
              </th>
              {ASPECT_KEYS.map((aspect) => (
                <th
                  key={aspect}
                  className="border-l border-gray-100 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  <div>{ASPECT_INFO[aspect].long}</div>
                  <div className="text-[10px] font-normal normal-case tracking-normal text-gray-400">
                    {ASPECT_INFO[aspect].ratio} · {ASPECT_INFO[aspect].resolution}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IMAGE_MODELS.map((model, mi) => {
              const rows: Quality[] = model.supportsQualityTiers ? QUALITY_ROWS : ["flat"];
              return rows.map((q, qi) => {
                const isFirstRow = qi === 0;
                const isLastModelRow = qi === rows.length - 1;
                const isNotLastModel = mi < IMAGE_MODELS.length - 1;
                return (
                  <tr
                    key={`${model.key}-${q}`}
                    className={`${isLastModelRow && isNotLastModel ? "border-b-2 border-gray-200" : "border-b border-gray-50"}`}
                  >
                    {isFirstRow ? (
                      <td
                        rowSpan={rows.length}
                        className="align-top px-5 py-4"
                      >
                        <Link
                          href={`/admin/models/${encodeURIComponent(model.key)}`}
                          className="group block cursor-pointer"
                          aria-label={`View ${model.label} details`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 underline decoration-gray-200 decoration-dotted underline-offset-4 transition-colors group-hover:text-indigo-600 group-hover:decoration-indigo-400">
                              {model.label}
                            </span>
                            <ModelBadge model={model.key} />
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {model.provider} · {model.tagline}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {model.capabilities.positive.slice(0, 3).map((c) => (
                              <CapabilityChip key={c} label={c} />
                            ))}
                            {model.capabilities.negative.slice(0, 1).map((c) => (
                              <CapabilityChip key={c} label={c} negative />
                            ))}
                          </div>
                          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 transition-colors group-hover:bg-indigo-100">
                            View details <span aria-hidden>→</span>
                          </span>
                        </Link>
                      </td>
                    ) : null}
                    <td className="px-5 py-3">
                      {q === "flat" ? (
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
                          flat price
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                            q === "low"
                              ? "bg-gray-50 text-gray-600 ring-gray-200"
                              : q === "medium"
                                ? "bg-gray-100 text-gray-700 ring-gray-300"
                                : "bg-gray-900 text-white ring-gray-900"
                          }`}
                        >
                          {q}
                        </span>
                      )}
                    </td>
                    {ASPECT_KEYS.map((aspect) => {
                      const price = priceFor(model.key, q, aspect, { batch });
                      if (price == null) {
                        return (
                          <td key={aspect} className="border-l border-gray-100 px-5 py-3 text-xs text-gray-300">
                            —
                          </td>
                        );
                      }
                      const rank = rankByCell[q][aspect][model.key] ?? 0;
                      const tone = toneForRank(rank);
                      const margin = Math.round(((REVENUE_PER_CREDIT - price) / REVENUE_PER_CREDIT) * 100);
                      return (
                        <td
                          key={aspect}
                          className="border-l border-gray-100 px-5 py-3"
                        >
                          <div
                            className={`inline-flex items-baseline gap-1.5 rounded-lg px-2 py-0.5 text-sm font-semibold ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
                          >
                            {fmtUsdPrecise(price)}
                            {rank === 0 && <span aria-hidden className="text-emerald-500">✓</span>}
                          </div>
                          <div
                            className={`mt-1 text-[10px] ${
                              margin < 0 ? "text-rose-500" : margin < 20 ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {margin >= 0 ? "+" : ""}
                            {margin}% margin
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3 text-[11px] text-gray-500">
        <span>
          Source: <code className="rounded bg-white px-1 py-0.5 text-gray-600">platform.openai.com/docs/guides/image-generation</code>{" "}
          · verified 2026-04-21.
        </span>
        <span className="text-gray-400">
          Margin assumes lowest pack tier ($0.05/credit). 1 image = 1 credit to the user.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-style cost pill (used in the routing table)
// ---------------------------------------------------------------------------

function CostBadge({
  model,
  quality,
  aspect,
}: {
  model: ModelKey;
  quality: Quality;
  aspect: AspectKey;
}) {
  const price = priceFor(model, quality, aspect);
  if (price == null) {
    return <span className="text-xs text-gray-300">—</span>;
  }
  const ranks = rankAt(aspect, quality);
  const rank = ranks[model] ?? 0;
  const tone = toneForRank(rank);
  const cheapest = Math.min(...IMAGE_MODELS
    .map((m) => priceFor(m.key, quality, aspect) ?? Infinity)
    .filter((p) => Number.isFinite(p)));
  const diff = cheapest > 0 ? Math.round(((price - cheapest) / cheapest) * 100) : 0;
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

function getProviderAvailability(): Record<string, boolean> {
  return { gemini: true, openai: true, anthropic: true };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

// Cost added per clipart image when background removal is enabled.
// BiRefNet v2 Light on fal.ai: ~0.5–1s at $0.0003–0.0005/s GPU time.
const BG_REMOVAL_COST = 0.0004;

// Models that trigger background removal for clipart (lack native transparency).
const BG_REMOVAL_MODELS: ReadonlySet<string> = new Set(["gpt-image-2", "gpt-image-1"]);

export default function AdminModelsPage() {
  const [imageConfig, setImageConfig] = useState<ImageModelConfig | null>(null);
  const [qualityConfig, setQualityConfig] = useState<QualityConfig | null>(null);
  const [textConfig, setTextConfig] = useState<TextModelConfig | null>(null);
  const [initial, setInitial] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, boolean> | null>(null);
  const [activeRoutingTab, setActiveRoutingTab] = useState<RoutingContentType>("clipart");
  const [bgRemovalEnabled, setBgRemovalEnabled] = useState<boolean>(true);
  const [bgRemovalModelId, setBgRemovalModelId] = useState<string>(DEFAULT_BG_REMOVAL_MODEL_ID);
  const [bgRemovalSaving, setBgRemovalSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings/model-config").then((r) => r.json()),
      fetch("/api/admin/settings/model-quality-config").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/settings/text-model-config").then((r) => r.json()),
      fetch("/api/admin/settings/text-model-config/keys").then((r) => r.json()).catch(() => getProviderAvailability()),
      fetch("/api/admin/settings/bg-removal").then((r) => r.json()).catch(() => ({ enabled: true })),
    ])
      .then(([rawImg, rawQual, txt, keys, bgRemoval]) => {
        const { model, quality } = normalizeToComposite(rawImg, rawQual);
        setImageConfig(model);
        setQualityConfig(quality);
        setTextConfig(txt);
        setInitial(JSON.stringify({ img: model, qual: quality, txt }));
        setApiKeys(keys);
        setBgRemovalEnabled(bgRemoval.enabled ?? true);
        setBgRemovalModelId(bgRemoval.modelId ?? DEFAULT_BG_REMOVAL_MODEL_ID);
      })
      .catch(() => setError("Failed to load model config"));
  }, []);

  async function saveBgRemovalConfig(patch: { enabled?: boolean; modelId?: string }) {
    setBgRemovalSaving(true);
    try {
      await fetch("/api/admin/settings/bg-removal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: patch.enabled ?? bgRemovalEnabled,
          modelId: patch.modelId ?? bgRemovalModelId,
        }),
      });
    } finally {
      setBgRemovalSaving(false);
    }
  }

  const dirty = useMemo(() => {
    if (!imageConfig || !qualityConfig || !textConfig) return false;
    return JSON.stringify({ img: imageConfig, qual: qualityConfig, txt: textConfig }) !== initial;
  }, [imageConfig, qualityConfig, textConfig, initial]);

  const modelDistribution = useMemo(() => {
    const zero = Object.fromEntries(IMAGE_MODELS.map((m) => [m.key, 0])) as Record<ModelKey, number>;
    if (!imageConfig) return zero;
    const out = { ...zero };
    for (const ct of ROUTING_CONTENT_TYPES) {
      for (const style of VALID_STYLES[ct] as StyleKey[]) {
        const m = normalizeModelKey(imageConfig[ck(ct, style)]);
        out[m] = (out[m] ?? 0) + 1;
      }
    }
    return out;
  }, [imageConfig]);

  async function handleSave() {
    if (!imageConfig || !qualityConfig || !textConfig) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const [imgRes, qualRes, txtRes] = await Promise.all([
        fetch("/api/admin/settings/model-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imageConfig),
        }),
        fetch("/api/admin/settings/model-quality-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(qualityConfig),
        }),
        fetch("/api/admin/settings/text-model-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(textConfig),
        }),
      ]);

      for (const [res, label] of [[imgRes, "image"], [qualRes, "quality"], [txtRes, "text"]] as const) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to save ${label} config`);
        }
      }

      setInitial(JSON.stringify({ img: imageConfig, qual: qualityConfig, txt: textConfig }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!imageConfig || !qualityConfig || !textConfig) {
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
          title="Model & quality routing per style"
          description="Each style can use a different model and quality tier. Pricing is aspect-ratio-aware — clipart renders at 1:1, illustrations at 4:3, coloring pages at 3:4."
          tooltip="All styles cost 1 credit to the user regardless of which model or quality is selected — this is a backend cost control, not a user-facing knob. Changes propagate to the generation pipeline within 60 seconds."
          right={
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              {IMAGE_MODELS.map((m) => (
                <span
                  key={m.key}
                  className="rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200"
                >
                  <span className="font-semibold text-gray-700">
                    {modelDistribution[m.key] ?? 0}
                  </span>
                  <span className="ml-1 text-gray-400">{m.label}</span>
                </span>
              ))}
            </div>
          }
        />

        <PricingMatrix />

        {/* Background removal — model selector + pricing */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Header row: label + toggle */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Background Removal</span>
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  fal.ai
                </span>
                {bgRemovalSaving && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                Post-processes <strong>gpt-image-2</strong> and <strong>gpt-image-1</strong> clipart to remove the white
                background. Those models reject{" "}
                <code className="rounded bg-gray-100 px-1 text-gray-600">background:&quot;transparent&quot;</code>.
                Disable to skip the fal.ai call for testing. Takes effect within 60s.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={bgRemovalEnabled}
              aria-label="Toggle background removal"
              onClick={() => {
                const next = !bgRemovalEnabled;
                setBgRemovalEnabled(next);
                saveBgRemovalConfig({ enabled: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                bgRemovalEnabled ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  bgRemovalEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Model selector table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Model
                  </th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Description
                  </th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Est. cost
                  </th>
                  <th className="w-16 px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {BG_REMOVAL_CATALOG.map((m) => {
                  const isActive = bgRemovalModelId === m.id;
                  // Cost delta vs current selection
                  const currentModel = BG_REMOVAL_CATALOG_BY_ID[bgRemovalModelId];
                  const delta = m.estimatedCost - (currentModel?.estimatedCost ?? 0);
                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${isActive ? "bg-indigo-50/40" : "hover:bg-gray-50/60"}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
                            {m.label}
                          </span>
                          {m.flatRate && (
                            <span className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                              flat rate
                            </span>
                          )}
                          {isActive && (
                            <span className="inline-flex rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                              active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-xs px-5 py-3 text-xs text-gray-500">
                        {m.description}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-gray-700">{m.pricingNote}</span>
                          {!isActive && (
                            <span className={`text-[10px] ${delta > 0 ? "text-rose-500" : delta < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                              {delta === 0 ? "same cost" : delta > 0 ? `+$${delta.toFixed(4)}/img vs active` : `-$${Math.abs(delta).toFixed(4)}/img vs active`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              setBgRemovalModelId(m.id);
                              saveBgRemovalConfig({ modelId: m.id });
                            }}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Use
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-2.5 text-[11px] text-gray-400">
            BiRefNet costs are GPU-time estimates (~$0.0005/s on fal.ai H100). Actual cost varies with image complexity. BRIA is a fixed flat rate.
          </div>
        </div>

        {/* Style routing table — per content type, fully decoupled */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Tab bar + bulk-set */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-3">
            <div className="flex items-center gap-1">
              {ROUTING_CONTENT_TYPES.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setActiveRoutingTab(ct)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeRoutingTab === ct
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {CONTENT_TYPE_LABELS[ct]}
                  <span className="ml-1.5 text-[10px] font-normal text-gray-400">
                    {(VALID_STYLES[ct] as StyleKey[]).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Bulk-set all styles in active tab to a single model */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Set all to:</span>
              <div className="flex items-center gap-1">
                {IMAGE_MODELS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setImageConfig((prev) => {
                        const next = { ...prev! };
                        for (const style of VALID_STYLES[activeRoutingTab] as StyleKey[]) {
                          next[ck(activeRoutingTab, style)] = m.key;
                        }
                        return next;
                      });
                    }}
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
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
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Cost per image
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(VALID_STYLES[activeRoutingTab] as StyleKey[]).map((style) => {
                  const key = ck(activeRoutingTab, style);
                  const aspect = CONTENT_TYPE_ASPECT[activeRoutingTab];
                  const selectedModel = normalizeModelKey(imageConfig[key]);
                  const selectedQuality = normalizeQuality(qualityConfig[key]);
                  const modelMeta = MODEL_BY_KEY[selectedModel];
                  const effectiveQuality: Quality = modelMeta.supportsQualityTiers
                    ? selectedQuality
                    : "flat";
                  // Flag shared styles (appear in both clipart and illustration)
                  const isShared =
                    activeRoutingTab !== "coloring" &&
                    VALID_STYLES.clipart.includes(style) &&
                    VALID_STYLES.illustration.includes(style);

                  return (
                    <tr key={key} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {STYLE_LABELS[style] || style}
                          </span>
                          {isShared && (
                            <span className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                              shared style
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-500">
                        <span className="font-mono">{ASPECT_INFO[aspect].ratio}</span>
                        <span className="ml-1.5 text-gray-400">· {ASPECT_INFO[aspect].resolution}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <select
                          value={selectedModel}
                          onChange={(e) =>
                            setImageConfig((prev) => ({
                              ...prev!,
                              [key]: e.target.value as ModelKey,
                            }))
                          }
                          className="w-full max-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        >
                          {IMAGE_MODELS.map((m) => (
                            <option key={m.key} value={m.key}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3.5">
                        {modelMeta.supportsQualityTiers ? (
                          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
                            {(["low", "medium", "high"] as Quality[]).map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() =>
                                  setQualityConfig((prev) => ({ ...prev!, [key]: q }))
                                }
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                  selectedQuality === q
                                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
                            flat
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-1">
                          <CostBadge
                            model={selectedModel}
                            quality={effectiveQuality}
                            aspect={aspect}
                          />
                          {bgRemovalEnabled &&
                            activeRoutingTab === "clipart" &&
                            BG_REMOVAL_MODELS.has(selectedModel) && (() => {
                              const base = priceFor(selectedModel, effectiveQuality, aspect);
                              const bgCost = BG_REMOVAL_CATALOG_BY_ID[bgRemovalModelId]?.estimatedCost ?? BG_REMOVAL_COST;
                              return base != null ? (
                                <span className="text-[10px] text-indigo-500">
                                  +${bgCost.toFixed(4)} bg ={" "}
                                  <span className="font-semibold">${(base + bgCost).toFixed(4)}</span>
                                </span>
                              ) : null;
                            })()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-2.5 text-[11px] text-gray-500">
            Styles marked <span className="mx-1 inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 ring-1 ring-inset ring-amber-200">shared style</span> appear in both Clip Art and Illustration — each now has its own independent model and quality setting.
          </div>
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
