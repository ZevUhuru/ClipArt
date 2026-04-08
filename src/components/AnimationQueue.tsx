"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAnimationQueue,
  isStale,
  type QueuedAnimation,
} from "@/stores/useAnimationQueue";

function useSimulatedProgress(startedAt: number, isActive: boolean) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) { setProgress(100); return; }

    function tick() {
      const elapsed = (Date.now() - startedAt) / 1000;
      let value: number;
      if (elapsed < 5) value = 12 * (1 - Math.pow(1 - elapsed / 5, 2.5));
      else if (elapsed < 20) value = 12 + 20 * ((elapsed - 5) / 15);
      else if (elapsed < 60) value = 32 + 40 * ((elapsed - 20) / 40);
      else if (elapsed < 120) value = 72 + 20 * ((elapsed - 60) / 60);
      else value = 92 + 7 * (1 - Math.exp(-(elapsed - 120) / 30));
      setProgress(Math.min(value, 99));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startedAt, isActive]);

  return progress;
}

function formatElapsed(startedAt: number): string {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

const FRAME_W = 88;
const FRAME_H = 72;
const PERF_HOLE_W = 8;
const PERF_HOLE_H = 5;
const PERF_GAP = 12;
const STRIP_PAD_Y = 12;

function SprocketHoles({ count, hasActive }: { count: number; hasActive: boolean }) {
  const totalWidth = count * (FRAME_W + 8) + 32;
  const holeCount = Math.max(Math.ceil(totalWidth / PERF_GAP), 8);

  return (
    <>
      {/* Top sprocket holes */}
      <div
        className={`flex gap-[4px] ${hasActive ? "animate-[filmScroll_2s_linear_infinite]" : ""}`}
        style={{ paddingLeft: 6 }}
      >
        {Array.from({ length: holeCount }).map((_, i) => (
          <div
            key={`t${i}`}
            className="shrink-0 rounded-[1.5px] bg-gray-700/60"
            style={{ width: PERF_HOLE_W, height: PERF_HOLE_H }}
          />
        ))}
      </div>
      {/* Bottom sprocket holes */}
      <div
        className={`flex gap-[4px] ${hasActive ? "animate-[filmScroll_2s_linear_infinite]" : ""}`}
        style={{ paddingLeft: 6 }}
      >
        {Array.from({ length: holeCount }).map((_, i) => (
          <div
            key={`b${i}`}
            className="shrink-0 rounded-[1.5px] bg-gray-700/60"
            style={{ width: PERF_HOLE_W, height: PERF_HOLE_H }}
          />
        ))}
      </div>
    </>
  );
}

function FilmFrame({
  job,
  onView,
  onDismiss,
  onCancel,
  onRetry,
}: {
  job: QueuedAnimation;
  onView: (job: QueuedAnimation) => void;
  onDismiss: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (job: QueuedAnimation) => void;
}) {
  const isActive = job.status === "processing";
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";
  const stale = isActive && isStale(job);
  const progress = useSimulatedProgress(job.startedAt, isActive);
  const [elapsed, setElapsed] = useState(formatElapsed(job.startedAt));

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setElapsed(formatElapsed(job.startedAt)), 1000);
    return () => clearInterval(interval);
  }, [isActive, job.startedAt]);

  const displayProgress = isComplete ? 100 : isFailed ? 0 : Math.round(progress);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={() => isComplete && onView(job)}
      className={`group relative shrink-0 overflow-hidden rounded-sm border transition-all ${
        isComplete
          ? "cursor-pointer border-gray-600 hover:border-emerald-400 hover:shadow-[0_0_8px_rgba(52,211,153,0.3)]"
          : isFailed
            ? "border-red-500/50"
            : stale
              ? "border-amber-500/50"
              : "border-gray-600"
      }`}
      style={{ width: FRAME_W, height: FRAME_H }}
    >
      {/* Source image */}
      {job.sourceUrl && (
        <Image
          src={job.sourceUrl}
          alt={job.sourceTitle}
          fill
          className={`object-cover ${
            isActive
              ? "brightness-[0.5] saturate-75"
              : isFailed
                ? "brightness-[0.35] saturate-0"
                : ""
          }`}
          sizes={`${FRAME_W}px`}
          unoptimized
        />
      )}

      {/* Active: flickering gate + progress */}
      {isActive && (
        <>
          <div className="absolute inset-0 animate-[flicker_3s_ease-in-out_infinite] bg-white/[0.03]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            {/* Mini progress bar styled like a film counter */}
            <div className="w-10 overflow-hidden rounded-full bg-white/20">
              <motion.div
                className={`h-1 rounded-full ${stale ? "bg-amber-400" : "bg-gradient-to-r from-pink-400 to-orange-400"}`}
                initial={{ width: "0%" }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] font-bold tabular-nums text-white/80">{elapsed}</span>
            <span className="text-[7px] font-medium text-white/50">{displayProgress}%</span>
          </div>
          {/* Duration + audio */}
          <div className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5">
            <span className="rounded bg-black/50 px-1 py-px text-[6px] font-bold tabular-nums text-white/80">
              {job.duration || 5}s
            </span>
            {job.audio && (
              <span className="rounded bg-purple-500/60 px-1 py-px text-[6px] font-bold text-white/80">
                ♪
              </span>
            )}
          </div>
        </>
      )}

      {/* Completed: play triangle */}
      {isComplete && (
        <span className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-black/20">
          <svg className="h-6 w-6 text-white drop-shadow-lg opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </span>
      )}

      {/* Failed overlay */}
      {isFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg className="h-4 w-4 text-red-400/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="mt-0.5 text-[7px] font-bold text-red-300">Failed</span>
        </div>
      )}

      {/* Stale badge */}
      {stale && (
        <span className="absolute right-0.5 top-0.5 rounded bg-amber-500/90 px-1 py-px text-[6px] font-bold text-white">
          Slow
        </span>
      )}

      {/* Dismiss (complete + failed) */}
      {(isComplete || isFailed) && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(job.id); }}
          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Cancel (active) */}
      {isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(job.id); }}
          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Cancel"
        >
          <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Retry (failed + stale) */}
      {(isFailed || stale) && (
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(job); }}
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded bg-white/90 px-1.5 py-px text-[7px] font-bold text-gray-800 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}

interface AnimationQueueProps {
  onViewResult?: (job: QueuedAnimation) => void;
  onRetry?: (job: QueuedAnimation) => void;
}

export function AnimationQueue({ onViewResult, onRetry }: AnimationQueueProps) {
  const jobs = useAnimationQueue((s) => s.jobs);
  const removeJob = useAnimationQueue((s) => s.removeJob);
  const cancelJob = useAnimationQueue((s) => s.cancelJob);

  const hasActive = useMemo(
    () => jobs.some((j) => j.status === "processing"),
    [jobs],
  );

  const handleRetry = useCallback(
    (job: QueuedAnimation) => {
      if (job.status === "processing") cancelJob(job.id);
      removeJob(job.id);
      onRetry?.(job);
    },
    [cancelJob, removeJob, onRetry],
  );

  if (jobs.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Animation Queue
          </p>
          {hasActive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
            </span>
          )}
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gray-500">
          {jobs.filter((j) => j.status === "processing").length} active
        </span>
      </div>

      {/* Film strip */}
      <div className="overflow-hidden rounded-lg bg-gray-900 shadow-inner">
        <div
          className="flex flex-col overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: 4, paddingBottom: 4 }}
        >
          {/* Top perforations */}
          <div className="overflow-hidden" style={{ height: PERF_HOLE_H, marginBottom: 3 }}>
            <SprocketHoles count={jobs.length} hasActive={hasActive} />
          </div>

          {/* Frames */}
          <div className="flex gap-1.5 px-2">
            <AnimatePresence mode="popLayout">
              {jobs.map((job) => (
                <FilmFrame
                  key={job.id}
                  job={job}
                  onView={(j) => onViewResult?.(j)}
                  onDismiss={removeJob}
                  onCancel={cancelJob}
                  onRetry={handleRetry}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom perforations */}
          <div className="overflow-hidden" style={{ height: PERF_HOLE_H, marginTop: 3 }}>
            <SprocketHoles count={jobs.length} hasActive={hasActive} />
          </div>
        </div>
      </div>

      {/* Inline CSS for film animations */}
      <style jsx global>{`
        @keyframes filmScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-${PERF_GAP}px); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
