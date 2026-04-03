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
  const stageLabel = isComplete
    ? "Complete"
    : isFailed
      ? job.error || "Failed"
      : getStageLabel(progress, stale);

  const borderColor = isComplete
    ? "border-emerald-200"
    : isFailed
      ? "border-red-200"
      : stale
        ? "border-amber-200"
        : "border-gray-200";

  const barGradient = stale
    ? "from-amber-400 to-orange-400"
    : "from-pink-400 to-orange-400";

  const statusColor = isComplete
    ? "text-emerald-600"
    : isFailed
      ? "text-red-500"
      : stale
        ? "text-amber-600"
        : "text-gray-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={`overflow-hidden rounded-xl border bg-white ${borderColor}`}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        {job.sourceUrl && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
            <Image
              src={job.sourceUrl}
              alt={job.sourceTitle}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gray-700">
            {job.sourceTitle}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-gray-400">
            {job.prompt}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isActive && (
            <span className="text-[10px] tabular-nums text-gray-400">
              {elapsed}
            </span>
          )}
          {isComplete && (
            <button
              onClick={() => onView(job)}
              className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
            >
              View
            </button>
          )}
          {isFailed && (
            <button
              onClick={() => onRetry(job)}
              className="rounded-md bg-pink-50 px-2 py-1 text-[10px] font-semibold text-pink-600 transition-colors hover:bg-pink-100"
            >
              Retry
            </button>
          )}
          {isActive && stale && (
            <button
              onClick={() => onRetry(job)}
              className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              Retry
            </button>
          )}
          {isActive && (
            <button
              onClick={() => onCancel(job.id)}
              className="rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
              aria-label="Cancel"
              title="Cancel animation"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {(isComplete || isFailed) && (
            <button
              onClick={() => onDismiss(job.id)}
              className="rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
              aria-label="Dismiss"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-gray-100">
        {isActive && (
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barGradient}`}
            initial={{ width: "0%" }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
        {isComplete && <div className="absolute inset-0 bg-emerald-400" />}
        {isFailed && <div className="absolute inset-0 bg-red-300" />}
      </div>

      {/* Combined status + percentage */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <p className={`text-[10px] font-medium ${statusColor}`}>
          {isActive ? `${stageLabel} · ${displayProgress}%` : stageLabel}
        </p>
        {stale && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
            Slow
          </span>
        )}
      </div>
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
      <div className="space-y-2">
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
