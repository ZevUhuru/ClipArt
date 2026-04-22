"use client";

import { useCallback, useMemo, useState } from "react";
import {
  IMAGE_MODELS,
  MODEL_BY_KEY,
  ASPECT_INFO,
  type AspectKey,
} from "@/lib/imageModelCatalog";
import type { ModelKey } from "@/lib/styles";
import { GenerationProgress } from "@/components/GenerationProgress";

type Quality = "low" | "medium" | "high";
type Wrapper = "none" | "clipart" | "coloring" | "illustration";

interface PlaygroundResult {
  dataUrl: string;
  model: ModelKey;
  quality: "low" | "medium" | "high" | "flat";
  aspect: AspectKey;
  elapsedMs: number;
  estimatedCost: number | null;
  finalPrompt: string;
}

const ASPECT_KEYS: AspectKey[] = ["square", "landscape", "portrait"];
const QUALITIES: Quality[] = ["low", "medium", "high"];
const WRAPPERS: { value: Wrapper; label: string }[] = [
  { value: "none", label: "None (raw prompt)" },
  { value: "clipart", label: "Clipart" },
  { value: "coloring", label: "Coloring" },
  { value: "illustration", label: "Illustration" },
];

function fmtCost(n: number | null): string {
  if (n == null) return "—";
  if (n < 0.01 && n > 0) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

export default function AdminPlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ModelKey>("gemini");
  const [aspect, setAspect] = useState<AspectKey>("square");
  const [quality, setQuality] = useState<Quality>("medium");
  const [wrapper, setWrapper] = useState<Wrapper>("none");
  const [showFinalPrompt, setShowFinalPrompt] = useState(false);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlaygroundResult | null>(null);

  const meta = MODEL_BY_KEY[model];
  const supportsQuality = meta.supportsQualityTiers;

  // Map the template wrapper to the site's shared progress variant so the
  // stage-label copy fits the output ("Drawing outlines…" etc. for coloring).
  const progressVariant: "clipart" | "coloring" = wrapper === "coloring" ? "coloring" : "clipart";

  const run = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || running) return;
    setError(null);
    setRunning(true);
    try {
      const res = await fetch("/api/admin/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          model,
          aspect,
          quality: supportsQuality ? quality : undefined,
          templateWrapper: wrapper,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`);
      } else {
        setResult(json as PlaygroundResult);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, [prompt, model, aspect, quality, wrapper, supportsQuality, running]);

  // Cmd/Ctrl+Enter submits from the textarea.
  const onPromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.dataUrl;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `playground-${result.model}-${result.aspect}-${ts}.png`;
    a.click();
  };

  const aspectContainerClass = useMemo(() => {
    if (!result) return "";
    switch (result.aspect) {
      case "square": return "aspect-square";
      case "landscape": return "aspect-[4/3]";
      case "portrait": return "aspect-[3/4]";
    }
  }, [result]);

  return (
    <div className="pb-16">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Admin · Evaluation
        </div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Prompt Playground</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Run a single prompt against any model in the catalog. Ephemeral — nothing is written to
          the library, R2, or routing config. Use this to evaluate model fit before committing to
          a new content type (e.g. worksheets) or routing change.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ─── Left: form ─── */}
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Field label="Prompt" hint="Cmd / Ctrl + Enter to run">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onPromptKeyDown}
              rows={6}
              placeholder="e.g. kindergarten math worksheet, addition up to 5, five problems with cartoon apples, clear instruction row at top"
              className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
            />
          </Field>

          <Field label="Model">
            <div className="grid gap-2 sm:grid-cols-2">
              {IMAGE_MODELS.map((m) => {
                const active = m.key === model;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModel(m.key)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{m.label}</span>
                      {m.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m.badge.label}
                        </span>
                      )}
                    </div>
                    <div className={`mt-0.5 text-[11px] ${active ? "text-white/70" : "text-gray-500"}`}>
                      {m.supportsQualityTiers ? "Quality tiers · low / med / high" : "Flat price"}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Aspect">
            <Segmented
              value={aspect}
              options={ASPECT_KEYS.map((a) => ({
                value: a,
                label: `${ASPECT_INFO[a].long} · ${ASPECT_INFO[a].ratio}`,
              }))}
              onChange={(v) => setAspect(v as AspectKey)}
            />
          </Field>

          {supportsQuality && (
            <Field label="Quality">
              <Segmented
                value={quality}
                options={QUALITIES.map((q) => ({ value: q, label: q }))}
                onChange={(v) => setQuality(v as Quality)}
              />
            </Field>
          )}

          <Field
            label="Template wrapper"
            hint="Appends the content-type directive to your prompt. Leave as None to test raw model behavior — recommended for new content types like worksheets."
          >
            <Segmented
              value={wrapper}
              options={WRAPPERS}
              onChange={(v) => setWrapper(v as Wrapper)}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-500">
              {result && !running
                ? <>Last run · <span className="font-mono">{(result.elapsedMs / 1000).toFixed(1)}s</span> · {fmtCost(result.estimatedCost)}</>
                : running
                  ? "Running…"
                  : "Not run yet"}
            </div>
            <button
              type="button"
              onClick={run}
              disabled={running || prompt.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {running ? "Generating…" : "Run"}
            </button>
          </div>
        </div>

        {/* ─── Right: output ─── */}
        <div className="space-y-3">
          {/* Shared progress card — same one used by Generator and the editor.
              Shows a phased bar + rotating stage labels during the in-flight
              call, then fades out. Keeps playground in lockstep with the rest
              of the site's generation UI. */}
          <GenerationProgress isGenerating={running} variant={progressVariant} />

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div
              className={`relative w-full ${result ? aspectContainerClass : "aspect-square"} bg-gradient-to-br from-gray-50 via-white to-gray-100`}
            >
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 ring-1 ring-inset ring-rose-200">
                    Error
                  </div>
                  <div className="max-w-md text-sm text-gray-700">{error}</div>
                  <button
                    type="button"
                    onClick={run}
                    className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!error && !result && !running && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                  Output will appear here
                </div>
              )}

              {result && (
                /* Raw img tag is fine here — data URLs aren't Next-image friendly and
                   this panel is admin-only. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={result.dataUrl}
                  alt="Generated output"
                  className={`absolute inset-0 h-full w-full object-contain ${running ? "opacity-60" : ""}`}
                />
              )}
            </div>
          </div>

          {result && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Model" value={MODEL_BY_KEY[result.model]?.label ?? result.model} />
                <Stat label="Quality" value={result.quality} />
                <Stat label="Aspect" value={`${ASPECT_INFO[result.aspect].long} · ${ASPECT_INFO[result.aspect].ratio}`} />
                <Stat label="Latency" value={`${(result.elapsedMs / 1000).toFixed(1)}s`} hint={`Est. ${fmtCost(result.estimatedCost)}`} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-300"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinalPrompt((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-300"
                >
                  {showFinalPrompt ? "Hide" : "Show"} final prompt
                </button>
              </div>
              {showFinalPrompt && (
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-gray-100">
                  {result.finalPrompt}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-gray-500">{hint}</div>}
    </div>
  );
}
