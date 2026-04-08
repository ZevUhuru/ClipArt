"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAnimationQueue,
  isStale,
  type QueuedAnimation,
} from "@/stores/useAnimationQueue";

const STATUS_STAGES = [
  { threshold: 0, label: "Queued" },
  { threshold: 10, label: "Generating frames" },
  { threshold: 30, label: "Rendering video" },
  { threshold: 75, label: "Almost done" },
  { threshold: 100, label: "Complete" },
];

const STALE_STAGES = [
  { threshold: 0, label: "Taking longer than expected" },
  { threshold: 50, label: "Still waiting on Fal.ai" },
  { threshold: 80, label: "This is unusually slow" },
];

function getStageLabel(progress: number, stale: boolean): string {
  const stages = stale ? STALE_STAGES : STATUS_STAGES;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (progress >= stages[i].threshold) return stages[i].label;
  }
  return stages[0].label;
}

function useSimulatedProgress(startedAt: number, isActive: boolean) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(100);
      return;
    }

    function tick() {
      const elapsed = (Date.now() - startedAt) / 1000;
      let value: number;
      if (elapsed < 5) {
        value = 12 * (1 - Math.pow(1 - elapsed / 5, 2.5));
      } else if (elapsed < 20) {
        value = 12 + 20 * ((elapsed - 5) / 15);
      } else if (elapsed < 60) {
        value = 32 + 40 * ((elapsed - 20) / 40);
      } else if (elapsed < 120) {
        value = 72 + 20 * ((elapsed - 60) / 60);
      } else {
        value = 92 + 7 * (1 - Math.exp(-(elapsed - 120) / 30));
      }
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

const CARD_SIZE = 80;
const RING_R = 10;
const RING_CIRC = 2 * Math.PI * RING_R;

function QueueCard({
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
  const strokeDash = (displayProgress / 100) * RING_CIRC;

  const ringGradientId = `animRing-${job.id.slice(0, 8)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={() => isComplete && onView(job)}
      className={`group relative shrink-0 overflow-hidden rounded-xl border transition-all ${
        isComplete
          ? "cursor-pointer border-emerald-200 hover:scale-[1.04] hover:ring-2 hover:ring-purple-400/40"
          : isFailed
            ? "border-red-200"
            : stale
              ? "border-amber-200"
              : "border-gray-200"
      }`}
      style={{ width: CARD_SIZE, height: CARD_SIZE }}
    >
      {/* Source image background (always shown if available) */}
      {job.sourceUrl && (
        <Image
          src={job.sourceUrl}
          alt={job.sourceTitle}
          fill
          className={`object-cover ${isActive ? "brightness-[0.6]" : isFailed ? "brightness-50 saturate-50" : ""}`}
          sizes={`${CARD_SIZE}px`}
          unoptimized
        />
      )}

      {/* Active: progress ring overlay */}
      {isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
            <circle cx="14" cy="14" r={RING_R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
            <circle
              cx="14" cy="14" r={RING_R} fill="none"
              stroke={`url(#${ringGradientId})`} strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${RING_CIRC}`}
              className="transition-[stroke-dasharray] duration-500 ease-out"
            />
            <defs>
              <linearGradient id={ringGradientId} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor={stale ? "#fbbf24" : "#f472b6"} />
                <stop offset="1" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
          <span className="mt-0.5 text-[8px] font-bold tabular-nums text-white/90">{elapsed}</span>
        </div>
      )}

      {/* Completed: play icon overlay on hover */}
      {isComplete && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <svg className="h-6 w-6 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </span>
      )}

      {/* Failed: error overlay */}
      {isFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/30">
          <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="mt-0.5 text-[8px] font-bold text-white/80">Failed</span>
        </div>
      )}

      {/* Stale badge */}
      {stale && (
        <span className="absolute left-1 top-1 rounded-full bg-amber-500 px-1 py-px text-[7px] font-bold text-white">
          Slow
        </span>
      )}

      {/* Duration + audio pills (bottom-left, always visible for active) */}
      {isActive && (
        <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
          <span className="rounded-full bg-black/40 px-1 py-px text-[7px] font-bold tabular-nums text-white backdrop-blur-sm">
            {job.duration || 5}s
          </span>
          {job.audio && (
            <span className="rounded-full bg-purple-500/70 px-1 py-px text-[7px] font-bold text-white backdrop-blur-sm">
              ♪
            </span>
          )}
        </div>
      )}

      {/* Dismiss X (complete + failed, hover only) */}
      {(isComplete || isFailed) && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(job.id); }}
          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Cancel X (active, hover only) */}
      {isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(job.id); }}
          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Cancel"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Retry button (failed + stale, hover only) */}
      {(isFailed || stale) && (
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(job); }}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[8px] font-bold text-gray-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
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

  const handleRetry = useCallback(
    (job: QueuedAnimation) => {
      if (job.status === "processing") {
        cancelJob(job.id);
      }
      removeJob(job.id);
      onRetry?.(job);
    },
    [cancelJob, removeJob, onRetry],
  );

  if (jobs.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Animation Queue
        </p>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gray-500">
          {jobs.filter((j) => j.status === "processing").length} active
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="popLayout">
          {jobs.map((job) => (
            <QueueCard
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
    </div>
  );
}
