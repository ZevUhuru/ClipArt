"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface SourceGen {
  id: string;
  image_url: string;
  title: string;
  slug: string;
}

interface AnimationRow {
  id: string;
  prompt: string;
  model: string;
  status: string;
  video_url: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_mosaic: boolean;
  is_public: boolean;
  created_at: string;
  source: SourceGen | null;
}

export default function AdminAnimationsPage() {
  const [animations, setAnimations] = useState<AnimationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [mosaicSlots, setMosaicSlots] = useState(6);
  const [slotsInput, setSlotsInput] = useState("6");
  const [slotsSaving, setSlotsSaving] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState<string | null>(null);
  const LIMIT = 50;

  const fetchAnimations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/animations?limit=${LIMIT}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setAnimations(data.animations || []);
        setTotal(data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [offset]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/homepage");
      if (res.ok) {
        const data = await res.json();
        const val = data.mosaic_animation_slots ?? 6;
        setMosaicSlots(val);
        setSlotsInput(String(val));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAnimations(); }, [fetchAnimations]);
  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const toggleFlag = async (id: string, field: "is_featured" | "is_mosaic", value: boolean) => {
    setAnimations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );

    try {
      await fetch("/api/admin/animations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
    } catch {
      setAnimations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: !value } : a)),
      );
    }
  };

  const saveSlots = async () => {
    const val = parseInt(slotsInput, 10);
    if (isNaN(val) || val < 0 || val > 20) {
      setSlotsMsg("Must be 0-20");
      return;
    }
    setSlotsSaving(true);
    setSlotsMsg(null);
    try {
      const res = await fetch("/api/admin/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mosaic_animation_slots: val }),
      });
      if (res.ok) {
        setMosaicSlots(val);
        setSlotsMsg("Saved");
        setTimeout(() => setSlotsMsg(null), 2000);
      } else {
        setSlotsMsg("Failed to save");
      }
    } catch {
      setSlotsMsg("Failed to save");
    }
    setSlotsSaving(false);
  };

  const featuredCount = animations.filter((a) => a.is_featured).length;
  const mosaicCount = animations.filter((a) => a.is_mosaic).length;
  const hasNext = offset + LIMIT < total;
  const hasPrev = offset > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Animations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Curate which animations appear on the homepage. Featured = grid section, Mosaic = hero background.
      </p>

      {/* Mosaic config */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Hero Mosaic Settings</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {mosaicCount} animation{mosaicCount !== 1 ? "s" : ""} flagged for mosaic, max {mosaicSlots} will display
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600">Max slots:</label>
            <input
              type="number"
              min={0}
              max={20}
              value={slotsInput}
              onChange={(e) => setSlotsInput(e.target.value)}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
            />
            <button
              onClick={saveSlots}
              disabled={slotsSaving}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {slotsSaving ? "Saving..." : "Save"}
            </button>
            {slotsMsg && (
              <span className={`text-xs font-medium ${slotsMsg === "Saved" ? "text-emerald-600" : "text-red-500"}`}>
                {slotsMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
        <span>{total} completed animation{total !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-pink-400" />
          {featuredCount} featured
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-400" />
          {mosaicCount} mosaic
        </span>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Image</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Prompt</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Model</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Featured</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Mosaic</th>
            </tr>
          </thead>
          <tbody>
            {loading && animations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : animations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No completed animations yet
                </td>
              </tr>
            ) : (
              animations.map((a) => {
                const src = a.source as SourceGen | null;
                const thumb = src?.image_url || a.thumbnail_url || "";
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-gray-50 transition-colors ${
                      a.is_featured || a.is_mosaic ? "bg-amber-50/30" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      {thumb ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100" />
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-xs text-gray-700" title={a.prompt}>
                        {a.prompt}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        {src?.title || "Unknown source"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {a.model.replace("kling-", "").replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFlag(a.id, "is_featured", !a.is_featured)}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          a.is_featured ? "bg-pink-500" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            a.is_featured ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFlag(a.id, "is_mosaic", !a.is_mosaic)}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          a.is_mosaic ? "bg-purple-500" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            a.is_mosaic ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={!hasPrev}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={!hasNext}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
