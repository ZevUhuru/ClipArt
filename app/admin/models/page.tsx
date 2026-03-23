"use client";

import { useEffect, useState } from "react";

const STYLES = ["flat", "outline", "cartoon", "sticker", "vintage", "watercolor"] as const;
const MODELS = [
  { value: "gemini", label: "Gemini (Google)" },
  { value: "dalle", label: "DALL-E 3 (OpenAI)" },
] as const;

type ModelConfig = Record<string, string>;

export default function AdminModelsPage() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/model-config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setError("Failed to load model config"));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings/model-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="py-12 text-center text-gray-500">
        {error || "Loading model configuration..."}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose which AI model powers each style. Changes take effect immediately.
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
            {STYLES.map((style) => (
              <tr key={style} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium capitalize text-gray-900">
                    {style}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={config[style] || "gemini"}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev!, [style]: e.target.value }))
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    {MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    (config[style] || "gemini") === "dalle"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-green-50 text-green-700"
                  }`}>
                    {(config[style] || "gemini") === "dalle" ? "~$0.04" : "~$0.002"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <strong>Note:</strong> All styles cost 1 credit to the user regardless of model.
        DALL-E 3 costs ~20x more per image than Gemini. The model config is cached for 60 seconds.
      </div>
    </div>
  );
}
