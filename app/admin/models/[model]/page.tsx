"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STYLE_LABELS, VALID_STYLES, type StyleKey, type ModelKey } from "@/lib/styles";
import {
  MODEL_BY_KEY,
  REVENUE_PER_CREDIT,
  ASPECT_INFO,
  priceFor,
  normalizeModelKey,
  type AspectKey,
  type Quality,
} from "@/lib/imageModelCatalog";

const ASPECT_KEYS: AspectKey[] = ["square", "landscape", "portrait"];
const QUALITY_ROWS: Quality[] = ["low", "medium", "high"];

const ALL_STYLES: StyleKey[] = [
  ...VALID_STYLES.clipart,
  ...VALID_STYLES.illustration.filter((s) => !VALID_STYLES.clipart.includes(s)),
  "coloring",
];

function fmtUsd(n: number): string {
  return `$${n.toFixed(3)}`;
}

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
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

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-[12px] leading-relaxed text-gray-100 shadow-sm">
      <code>{code}</code>
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminModelDetailPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model: rawModel } = use(params);
  const modelKey = normalizeModelKey(rawModel) as ModelKey;
  const meta = MODEL_BY_KEY[modelKey];

  const [imageConfig, setImageConfig] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/model-config")
      .then((r) => r.json())
      .then(setImageConfig)
      .catch(() => setImageConfig({}));
  }, []);

  const stylesUsingThisModel = useMemo(() => {
    if (!imageConfig) return [] as StyleKey[];
    return ALL_STYLES.filter((style) => normalizeModelKey(imageConfig[style]) === modelKey);
  }, [imageConfig, modelKey]);

  if (!meta) {
    notFound();
  }

  const qualityRows: Quality[] = meta.supportsQualityTiers ? QUALITY_ROWS : ["flat"];
  const cheapestMedium =
    meta.supportsQualityTiers
      ? Math.min(...ASPECT_KEYS.map((a) => priceFor(meta.key, "medium", a) ?? Infinity))
      : Math.min(...ASPECT_KEYS.map((a) => priceFor(meta.key, "flat", a) ?? Infinity));

  const tonesForBadge = {
    indigo:  "bg-indigo-50 text-indigo-700 ring-indigo-200",
    purple:  "bg-purple-50 text-purple-700 ring-purple-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    gray:    "bg-gray-50 text-gray-500 ring-gray-200",
  } as const;

  return (
    <div className="pb-16">
      {/* Back link */}
      <Link
        href="/admin/models"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <span aria-hidden>←</span> Back to model configuration
      </Link>

      {/* ─── Hero ─── */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 shadow-sm">
        <div className="px-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  {meta.provider}
                </span>
                {meta.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${tonesForBadge[meta.badge.tone]}`}
                  >
                    {meta.badge.label}
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">{meta.label}</h1>
              <p className="mt-1 text-sm text-gray-500">{meta.tagline}</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">
                {meta.description}
              </p>
            </div>
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
              aria-label={`Open official ${meta.label} documentation in a new tab`}
            >
              Official docs <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-6 border-t border-gray-100 bg-white px-8 py-5 md:grid-cols-4">
          <Stat
            label="API model"
            value={<code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">{meta.apiModelId}</code>}
            hint={meta.endpoint}
          />
          <Stat label="Released" value={meta.releaseDate} />
          <Stat
            label="Cheapest rate"
            value={fmtUsd(cheapestMedium)}
            hint={meta.supportsQualityTiers ? "at medium quality" : "flat across all sizes"}
          />
          <Stat
            label="Status in clip.art"
            value={
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                  meta.status === "new"
                    ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                    : meta.status === "current"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-gray-100 text-gray-600 ring-gray-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {meta.status}
              </span>
            }
            hint={`${stylesUsingThisModel.length} styles currently routed here`}
          />
        </div>
      </div>

      {/* ─── Pricing matrix ─── */}
      <section className="mt-10">
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Pricing
          </span>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Cost per image · {meta.supportsQualityTiers ? "by quality × aspect ratio" : "flat rate"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Source:{" "}
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
            >
              official {meta.provider} documentation
            </a>
            . Margin column compares each price against the lowest credit-pack tier ($0.05/credit).
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
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
              {qualityRows.map((q) => (
                <tr key={q} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-5 py-4">
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
                    const price = priceFor(meta.key, q, aspect);
                    if (price == null) {
                      return (
                        <td key={aspect} className="border-l border-gray-100 px-5 py-4 text-xs text-gray-300">—</td>
                      );
                    }
                    const margin = Math.round(((REVENUE_PER_CREDIT - price) / REVENUE_PER_CREDIT) * 100);
                    return (
                      <td key={aspect} className="border-l border-gray-100 px-5 py-4">
                        <div className="text-lg font-semibold text-gray-900">{fmtUsd(price)}</div>
                        <div
                          className={`mt-0.5 text-[11px] ${
                            margin < 0 ? "text-rose-500" : margin < 20 ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {margin >= 0 ? "+" : ""}
                          {margin}% margin @ $0.05/credit
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Capabilities ─── */}
      <section className="mt-10">
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Capabilities
          </span>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">What this model does and doesn't do</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Supports
              </h3>
            </div>
            <ul className="space-y-2">
              {meta.capabilities.positive.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-gray-700">
                  <span aria-hidden className="mt-0.5 text-emerald-500">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Doesn't support
              </h3>
            </div>
            <ul className="space-y-2">
              {meta.capabilities.negative.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-gray-500">
                  <span aria-hidden className="mt-0.5 text-rose-400">✕</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Parameters ─── */}
      <section className="mt-10">
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            API Parameters
          </span>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Supported request params</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Every parameter accepted by the {meta.apiModelId} endpoint. Required params are marked.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Values
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {meta.params.map((p) => (
                <tr key={p.name}>
                  <td className="px-5 py-3 align-top">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
                      {p.name}
                    </code>
                    {p.required && (
                      <span className="ml-1.5 rounded bg-rose-50 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-600 ring-1 ring-inset ring-rose-200">
                        req
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top text-xs text-gray-500">{p.type}</td>
                  <td className="px-5 py-3 align-top">
                    {p.values ? (
                      <code className="font-mono text-[11px] text-gray-600">{p.values}</code>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top text-sm text-gray-600">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Example call ─── */}
      <section className="mt-10">
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Integration
          </span>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Example call from clip.art</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            How this model is invoked from the app's generation pipeline.
          </p>
        </div>
        <CodeBlock code={meta.exampleCall} />
      </section>

      {/* ─── Where used ─── */}
      <section className="mt-10">
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Current Usage
          </span>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Styles routed to {meta.label}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Change routing on the{" "}
            <Link href="/admin/models" className="text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-gray-900">
              overview page
            </Link>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {imageConfig === null ? (
            <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
          ) : stylesUsingThisModel.length === 0 ? (
            <p className="text-sm text-gray-500">
              No styles are currently routed to this model.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stylesUsingThisModel.map((style) => (
                <span
                  key={style}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                >
                  {STYLE_LABELS[style] || style}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
