"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SourceGeneration {
  id: string;
  image_url: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  aspect_ratio: string | null;
  style: string | null;
}

interface ShotAnimation {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  status: "processing" | "completed" | "failed";
  prompt: string | null;
  duration: number;
}

interface Shot {
  id: string;
  item_type: "shot";
  position: number | null;
  note: string | null;
  generation_id: string | null;
  animation_id: string | null;
  generation: SourceGeneration | null;
  animation: ShotAnimation | null;
  // local UI state
  _generating?: boolean;
  _generatingId?: string;
  _progress?: number;
  _error?: string | null;
}

interface Project {
  id: string;
  name: string;
  project_type: "collection" | "short";
  item_count: number;
  cover_image_url: string | null;
}

// ─── Image picker modal ────────────────────────────────────────────────────

interface PickerImage {
  id: string;
  image_url: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  aspect_ratio: string | null;
  style: string | null;
}

function ImagePickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (img: PickerImage) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<PickerImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/images?filter=all&limit=60&offset=0&sort=newest")
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Pick a source image</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No images in your Library yet.{" "}
              <Link href="/create" className="ml-1 text-pink-500 hover:underline">Create some</Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => onSelect(img)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-50 ring-2 ring-transparent transition-all hover:ring-pink-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt={img.title || ""} className="h-full w-full object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <svg className="h-5 w-5 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sprocket holes component ──────────────────────────────────────────────
// Mirrors the AnimationQueue design — vertical strip with perforations

const HOLE_H = 12;
const HOLE_W = 8;
const HOLE_GAP = 20;

function VerticalSprockets({ height }: { height: number }) {
  const count = Math.max(Math.ceil(height / HOLE_GAP), 2);
  return (
    <div className="flex flex-col gap-0 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mx-auto shrink-0 rounded-[2px] bg-gray-700/60"
          style={{ width: HOLE_W, height: HOLE_H, marginBottom: HOLE_GAP - HOLE_H }}
        />
      ))}
    </div>
  );
}

// ─── Individual shot card ──────────────────────────────────────────────────

const MODELS = [
  { id: "kling-standard", label: "Kling" },
  { id: "seedance", label: "Seedance" },
] as const;

type ShotModel = (typeof MODELS)[number]["id"];

function ShotCard({
  shot,
  index,
  total,
  isPlaying,
  onMoveUp,
  onMoveDown,
  onDelete,
  onGenerate,
  onUpdateNote,
  onViewClip,
}: {
  shot: Shot;
  index: number;
  total: number;
  isPlaying: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onGenerate: (model: ShotModel, duration: number) => void;
  onUpdateNote: (note: string) => void;
  onViewClip: () => void;
}) {
  const [prompt, setPrompt] = useState(shot.note || "");
  const [model, setModel] = useState<ShotModel>("kling-standard");
  const [duration, setDuration] = useState(5);
  const [promptEditing, setPromptEditing] = useState(false);

  // Sync prompt from parent when shot changes (e.g. initial load)
  useEffect(() => {
    if (!promptEditing) setPrompt(shot.note || "");
  }, [shot.note, promptEditing]);

  const hasClip = !!shot.animation?.video_url && shot.animation.status === "completed";
  const isGenerating = !!shot._generating;
  const hasFailed = !!shot._error;

  // Estimated strip height for sprocket holes
  const STRIP_HEIGHT = 220;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`flex min-h-[200px] overflow-hidden rounded-2xl transition-all ${
        isPlaying ? "ring-2 ring-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.25)]" : "ring-1 ring-gray-200"
      }`}
    >
      {/* ── Film strip left panel ── */}
      <div
        className="relative flex shrink-0 flex-col bg-[#1c1c27]"
        style={{ width: 120 }}
      >
        {/* Left sprocket column */}
        <div className="absolute inset-y-0 left-0 flex w-5 items-start">
          <VerticalSprockets height={STRIP_HEIGHT} />
        </div>

        {/* Right sprocket column */}
        <div className="absolute inset-y-0 right-0 flex w-5 items-start">
          <VerticalSprockets height={STRIP_HEIGHT} />
        </div>

        {/* Frame content (image / video / placeholder) */}
        <div className="mx-5 my-auto flex flex-1 flex-col items-center justify-center py-4">
          {/* Shot number */}
          <span className="mb-2 font-mono text-[10px] font-bold text-white/30">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Media frame */}
          <div className={`relative w-full overflow-hidden rounded-sm ${
            hasClip
              ? "shadow-[0_0_8px_rgba(52,211,153,0.3)]"
              : hasFailed
                ? "ring-1 ring-red-500/50"
                : ""
          }`}
            style={{ aspectRatio: shot.generation?.aspect_ratio?.replace(":", "/") || "1/1" }}
          >
            {hasClip ? (
              <video
                src={shot.animation!.video_url}
                className="h-full w-full object-cover"
                autoPlay={isPlaying}
                muted
                loop={!isPlaying}
                playsInline
              />
            ) : shot.generation?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shot.generation.image_url}
                alt={shot.generation.title || ""}
                className={`h-full w-full object-cover ${isGenerating ? "brightness-50 saturate-75" : ""}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/5">
                <svg className="h-5 w-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M18 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125" />
                </svg>
              </div>
            )}

            {/* Processing overlay */}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="h-1 w-10 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                    initial={{ width: "0%" }}
                    animate={{ width: `${shot._progress ?? 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="font-mono text-[9px] text-white/60">{shot._progress ?? 0}%</span>
              </div>
            )}

            {/* Completed play button */}
            {hasClip && !isPlaying && (
              <button
                onClick={onViewClip}
                className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30"
              >
                <svg className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </button>
            )}
          </div>

          {/* Status badge */}
          {hasClip && (
            <span className="mt-1.5 text-[9px] font-semibold text-emerald-400">✓ Ready</span>
          )}
          {isGenerating && (
            <span className="mt-1.5 flex items-center gap-1 text-[9px] text-pink-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pink-500" />
              </span>
              Generating
            </span>
          )}
          {hasFailed && (
            <span className="mt-1.5 text-[9px] font-semibold text-red-400">Failed</span>
          )}
        </div>
      </div>

      {/* ── Production notes right panel ── */}
      <div className="flex flex-1 flex-col gap-4 bg-white p-5">
        {/* Header row: prompt + reorder + delete */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Motion prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setPromptEditing(true); }}
              onBlur={() => { setPromptEditing(false); onUpdateNote(prompt); }}
              placeholder="Describe the motion… 'Camera slowly zooms in, leaves flutter'"
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-300"
            />
          </div>

          {/* Up / Down / Delete */}
          <div className="mt-5 flex flex-col gap-1">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              title="Move up"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              title="Move down"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
              title="Delete shot"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Model + duration */}
        {!hasClip && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Model</p>
              <div className="mt-1 flex gap-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id as ShotModel)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      model === m.id
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Duration</p>
              <div className="mt-1 flex gap-1.5">
                {[5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      duration === d
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {hasFailed && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {shot._error || "Generation failed. Try again."}
          </p>
        )}

        {/* Source image info */}
        {shot.generation && (
          <p className="truncate text-xs text-gray-400">
            Source: <span className="text-gray-600">{shot.generation.title || shot.generation.id.slice(0, 8)}</span>
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          {hasClip ? (
            <button
              onClick={onViewClip}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
              View clip
            </button>
          ) : isGenerating ? (
            <span className="rounded-lg bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600">
              Generating…
            </span>
          ) : (
            <button
              onClick={() => onGenerate(model, duration)}
              disabled={!shot.generation}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              {hasFailed ? "Retry" : "Generate"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 4000;

export default function StoryboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, openAuthModal } = useAppStore();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [clipViewerUrl, setClipViewerUrl] = useState<string | null>(null);

  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // ── Load project ────────────────────────────────────────────────────────

  const loadProject = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/me/projects/${projectId}`);
    if (!res.ok) { router.replace("/library"); return; }
    const data = await res.json();
    setProject(data.project);
    setProjectName(data.project.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawItems: any[] = data.items || [];
    setShots(
      rawItems.map((item) => ({
        id: item.id,
        item_type: "shot",
        position: item.position,
        note: item.note,
        generation_id: item.generation_id,
        animation_id: item.animation_id,
        generation: item.generation || null,
        animation: item.animation || null,
      })),
    );
    setLoading(false);
  }, [user, projectId, router]);

  useEffect(() => {
    if (user) loadProject();
    else if (user === null) openAuthModal("signin");
  }, [user, loadProject, openAuthModal]);

  // Clean up poll timers on unmount
  useEffect(() => {
    const timers = pollTimers.current;
    return () => { Object.values(timers).forEach(clearInterval); };
  }, []);

  // ── Add shot ────────────────────────────────────────────────────────────

  async function handlePickImage(img: PickerImage) {
    setShowPicker(false);
    const res = await fetch(`/api/me/projects/${projectId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_type: "shot",
        generation_id: img.id,
        note: "",
      }),
    });
    const data = await res.json();
    if (data.item) {
      setShots((prev) => [
        ...prev,
        {
          id: data.item.id,
          item_type: "shot",
          position: data.item.position,
          note: data.item.note,
          generation_id: img.id,
          animation_id: null,
          generation: {
            id: img.id,
            image_url: img.image_url,
            title: img.title,
            slug: img.slug,
            category: img.category,
            aspect_ratio: img.aspect_ratio,
            style: img.style,
          },
          animation: null,
        },
      ]);
    }
  }

  // ── Generate animation for a shot ───────────────────────────────────────

  async function handleGenerate(shotId: string, model: string, duration: number) {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot?.generation) return;

    // Optimistic update
    setShots((prev) =>
      prev.map((s) =>
        s.id === shotId ? { ...s, _generating: true, _progress: 5, _error: null } : s,
      ),
    );

    try {
      const res = await fetch("/api/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: shot.generation.image_url,
          prompt: shot.note || "",
          model,
          duration,
          audio: false,
          aspectRatio: shot.generation.aspect_ratio || "1:1",
        }),
      });

      const data = await res.json();
      if (!data.animationId) throw new Error("No animationId");

      // Store the animationId on the shot for display
      setShots((prev) =>
        prev.map((s) =>
          s.id === shotId ? { ...s, _generatingId: data.animationId, _progress: 10 } : s,
        ),
      );

      // Start polling
      startPoll(shotId, data.animationId);
    } catch (err) {
      setShots((prev) =>
        prev.map((s) =>
          s.id === shotId
            ? { ...s, _generating: false, _error: (err as Error).message || "Failed to start" }
            : s,
        ),
      );
    }
  }

  function startPoll(shotId: string, animationId: string) {
    if (pollTimers.current[shotId]) clearInterval(pollTimers.current[shotId]);

    let elapsed = 10;

    pollTimers.current[shotId] = setInterval(async () => {
      try {
        const res = await fetch(`/api/animate/status?id=${animationId}`);
        const data = await res.json();

        // Simulate progress even if API doesn't return it
        elapsed = Math.min(elapsed + 3, 92);
        const simulatedProgress = elapsed;

        if (data.status === "completed" && data.videoUrl) {
          clearInterval(pollTimers.current[shotId]);
          delete pollTimers.current[shotId];

          // Save animation_id to project_item
          await fetch(`/api/me/projects/${projectId}/items/${shotId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animation_id: animationId }),
          });

          // Update local state
          setShots((prev) =>
            prev.map((s) =>
              s.id === shotId
                ? {
                    ...s,
                    animation_id: animationId,
                    _generating: false,
                    _generatingId: undefined,
                    _progress: 100,
                    animation: {
                      id: animationId,
                      video_url: data.videoUrl,
                      thumbnail_url: data.thumbnailUrl || null,
                      preview_url: null,
                      status: "completed",
                      prompt: s.note,
                      duration: data.duration || 5,
                    },
                  }
                : s,
            ),
          );
        } else if (data.status === "failed") {
          clearInterval(pollTimers.current[shotId]);
          delete pollTimers.current[shotId];

          setShots((prev) =>
            prev.map((s) =>
              s.id === shotId
                ? { ...s, _generating: false, _error: "Generation failed" }
                : s,
            ),
          );
        } else {
          // Still processing
          setShots((prev) =>
            prev.map((s) =>
              s.id === shotId ? { ...s, _progress: simulatedProgress } : s,
            ),
          );
        }
      } catch {
        // Silently retry
      }
    }, POLL_INTERVAL);
  }

  // ── Update note ──────────────────────────────────────────────────────────

  async function handleUpdateNote(shotId: string, note: string) {
    setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, note } : s)));
    await fetch(`/api/me/projects/${projectId}/items/${shotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
  }

  // ── Reorder (swap positions) ─────────────────────────────────────────────

  async function handleMove(index: number, direction: "up" | "down") {
    const newShots = [...shots];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newShots.length) return;

    [newShots[index], newShots[targetIndex]] = [newShots[targetIndex], newShots[index]];
    setShots(newShots);

    // Persist new positions
    await Promise.all([
      fetch(`/api/me/projects/${projectId}/items/${newShots[index].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: index + 1 }),
      }),
      fetch(`/api/me/projects/${projectId}/items/${newShots[targetIndex].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: targetIndex + 1 }),
      }),
    ]);
  }

  // ── Delete shot ──────────────────────────────────────────────────────────

  async function handleDelete(shotId: string) {
    if (pollTimers.current[shotId]) {
      clearInterval(pollTimers.current[shotId]);
      delete pollTimers.current[shotId];
    }
    setShots((prev) => prev.filter((s) => s.id !== shotId));
    await fetch(`/api/me/projects/${projectId}/items/${shotId}`, { method: "DELETE" });
  }

  // ── Rename project ───────────────────────────────────────────────────────

  async function handleRename() {
    setEditingName(false);
    if (!projectName.trim() || projectName === project?.name) return;
    await fetch(`/api/me/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName }),
    });
    setProject((p) => (p ? { ...p, name: projectName } : p));
  }

  // ── Play all ─────────────────────────────────────────────────────────────

  const readyShots = shots.filter((s) => s.animation?.status === "completed");
  const allReady = readyShots.length === shots.length && shots.length > 0;

  function handlePlayAll() {
    if (readyShots.length === 0) return;
    setPlayingIndex(0);
  }

  function handlePlayNext() {
    setPlayingIndex((prev) => {
      if (prev === null) return null;
      const next = prev + 1;
      if (next >= shots.length) return null;
      return next;
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <Link href="/library?tab=projects" className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>

        {/* Project name (inline edit) */}
        {editingName ? (
          <input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setProjectName(project?.name || ""); setEditingName(false); } }}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-bold text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            {project?.name}
            <svg className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
        )}

        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
          {shots.length} shot{shots.length !== 1 ? "s" : ""}
        </span>

        <span className="h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          {readyShots.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
              Play all ({readyShots.length})
            </button>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add shot
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {shots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-center">
            {/* Mini film strip illustration */}
            <div className="mb-6 flex h-16 items-center gap-1 overflow-hidden rounded-lg bg-[#1c1c27] px-3 opacity-60">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-10 rounded-sm bg-gray-600/50" />
              ))}
            </div>
            <h2 className="text-base font-semibold text-gray-700">No shots yet</h2>
            <p className="mt-1 text-sm text-gray-400">
              Add your first shot to start building your short.
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="btn-primary mt-5 text-sm"
            >
              Add first shot
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {shots.map((shot, index) => (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  index={index}
                  total={shots.length}
                  isPlaying={playingIndex === index}
                  onMoveUp={() => handleMove(index, "up")}
                  onMoveDown={() => handleMove(index, "down")}
                  onDelete={() => handleDelete(shot.id)}
                  onGenerate={(model, duration) => handleGenerate(shot.id, model, duration)}
                  onUpdateNote={(note) => handleUpdateNote(shot.id, note)}
                  onViewClip={() => {
                    if (shot.animation?.video_url) setClipViewerUrl(shot.animation.video_url);
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Add shot button at the bottom of the list */}
            <button
              onClick={() => setShowPicker(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white py-5 text-sm font-medium text-gray-400 transition-all hover:border-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add shot
            </button>
          </div>
        )}
      </div>

      {/* Image picker modal */}
      <AnimatePresence>
        {showPicker && (
          <ImagePickerModal
            onSelect={handlePickImage}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Clip viewer overlay */}
      <AnimatePresence>
        {clipViewerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClipViewerUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
              <video
                src={clipViewerUrl}
                autoPlay
                controls
                loop
                className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
                onEnded={handlePlayNext}
              />
              <button
                onClick={() => setClipViewerUrl(null)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play-all: auto-advance overlay indicator */}
      <AnimatePresence>
        {playingIndex !== null && !clipViewerUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-full bg-gray-900/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm shadow-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Playing shot {playingIndex + 1} of {shots.length}
            <button
              onClick={() => setPlayingIndex(null)}
              className="ml-1 rounded-full px-2 py-0.5 text-xs text-gray-400 hover:text-white"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
