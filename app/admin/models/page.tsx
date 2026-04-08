"use client";

import { useEffect, useState, useRef } from "react";
import { STYLE_LABELS, VALID_STYLES, type StyleKey } from "@/lib/styles";

// ---------------------------------------------------------------------------
// Image generation config
// ---------------------------------------------------------------------------

const ALL_STYLES: StyleKey[] = [
  ...VALID_STYLES.clipart,
  ...VALID_STYLES.illustration.filter((s) => !VALID_STYLES.clipart.includes(s)),
  "coloring",
];

const STYLE_CONTENT_TYPE: Record<string, string> = {};
for (const s of VALID_STYLES.clipart) STYLE_CONTENT_TYPE[s] = "clipart";
for (const s of VALID_STYLES.illustration) {
  STYLE_CONTENT_TYPE[s] = STYLE_CONTENT_TYPE[s] ? "shared" : "illustration";
}
STYLE_CONTENT_TYPE["coloring"] = "coloring";

const IMAGE_MODELS = [
  { value: "gemini", label: "Gemini (Google)" },
  { value: "dalle", label: "GPT Image 1 (OpenAI)" },
] as const;

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
type ImageModelConfig = Record<string, string>;

// ---------------------------------------------------------------------------
// Info tooltip component
// ---------------------------------------------------------------------------

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative inline-flex" ref={ref}>
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

// ---------------------------------------------------------------------------
// Provider key detection (passed from API check)
// ---------------------------------------------------------------------------

function getProviderAvailability(): Record<string, boolean> {
  return {
    gemini: true,
    openai: true,
    anthropic: true,
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminModelsPage() {
  const [imageConfig, setImageConfig] = useState<ImageModelConfig | null>(null);
  const [textConfig, setTextConfig] = useState<TextModelConfig | null>(null);
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
        setTextConfig(txt);
        setApiKeys(keys);
      })
      .catch(() => setError("Failed to load model config"));
  }, []);

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
      <div className="py-12 text-center text-gray-500">
        {error || "Loading model configuration..."}
      </div>
    );
  }

  const keys = apiKeys || getProviderAvailability();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose which AI models power image generation and text intelligence. Changes take effect immediately.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ─── IMAGE GENERATION ─── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Image Generation
          </h2>
          <InfoTooltip text="Each generation style can use a different image model. The model determines the visual engine used when a user creates an image. All styles cost 1 credit to the user regardless of which model is selected." />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Style
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cost per image
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ALL_STYLES.map((style) => (
                <tr key={style} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {STYLE_LABELS[style] || style}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        STYLE_CONTENT_TYPE[style] === "shared"
                          ? "bg-gray-100 text-gray-500"
                          : STYLE_CONTENT_TYPE[style] === "illustration"
                            ? "bg-purple-50 text-purple-600"
                            : STYLE_CONTENT_TYPE[style] === "coloring"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-50 text-gray-500"
                      }`}>
                        {STYLE_CONTENT_TYPE[style] || "clipart"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={imageConfig[style] || "gemini"}
                      onChange={(e) =>
                        setImageConfig((prev) => ({ ...prev!, [style]: e.target.value }))
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      {IMAGE_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      (imageConfig[style] || "gemini") === "dalle"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {(imageConfig[style] || "gemini") === "dalle" ? "~$0.011" : "~$0.039"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <strong>Note:</strong> All styles cost 1 credit to the user regardless of model.
          GPT Image 1 (~$0.011) is ~3.5x cheaper than Gemini (~$0.039) per image.
        </div>
      </section>

      {/* ─── TEXT AI ─── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Text AI
          </h2>
          <InfoTooltip text="Models that power content classification, SEO generation, and animation suggestions. Each task can use a different model so you can optimize cost for high-volume tasks and quality for low-volume tasks. Config is cached for 60 seconds." />
        </div>

        <div className="space-y-3">
          {TEXT_TASKS.map((task) => {
            const meta = TASK_META[task];
            const selectedId = textConfig[task] || "gemini-2.5-flash";
            const selectedModel = TEXT_MODELS.find((m) => m.id === selectedId);

            return (
              <div
                key={task}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: task info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{meta.label}</h3>
                      <InfoTooltip text={meta.tooltip} />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{meta.description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{meta.hint}</p>
                  </div>

                  {/* Right: dropdown + cost */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <select
                      value={selectedId}
                      onChange={(e) =>
                        setTextConfig((prev) => ({ ...prev!, [task]: e.target.value }))
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      {TEXT_MODELS.map((m) => {
                        const providerAvailable = keys[m.provider] !== false;
                        return (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={!providerAvailable}
                          >
                            {m.label}
                            {!providerAvailable ? " (key missing)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {selectedModel && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          {selectedModel.costInput}/{selectedModel.costOutput} per 1M
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <strong>Note:</strong> Cost shown is input/output per 1M tokens.
          Claude models require <code className="rounded bg-gray-200 px-1 py-0.5">ANTHROPIC_API_KEY</code>.
          GPT models require <code className="rounded bg-gray-200 px-1 py-0.5">OPENAI_API_KEY</code>.
          Config is cached for 60 seconds.
        </div>
      </section>
    </div>
  );
}
