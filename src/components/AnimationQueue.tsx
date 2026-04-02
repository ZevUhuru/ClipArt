"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimationQueue, type QueuedAnimation } from "@/stores/useAnimationQueue";

const STATUS_STAGES = [
  { threshold: 0, label: "Queued" },
  { threshold: 10, label: "Generating frames" },
  { threshold: 30, label: "Rendering video" },
  { threshold: 75, label: "Almost done" },
  { threshold: 100, label: "Complete" },
];

function getStageLabel(progress: number): string {
  for (let i = STATUS_STAGES.length - 1; i >= 0; i--) {
    if (progress >= STATUS_STAGES[i].threshold) return STATUS_STAGES[i].label;
  }
  return STATUS_STAGES[0].label;
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
}: {
  job: QueuedAnimation;
  onView: (job: QueuedAnimation) => void;
  onDismiss: (id: string) => void;
}) {
  const isActive = job.status === "processing";
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";
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
      : getStageLabel(progress);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={`overflow-hidden rounded-xl border bg-white ${
        isComplete
          ? "border-emerald-200"
          : isFailed
            ? "border-red-200"
            : "border-gray-200"
      }`}
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
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-400 to-orange-400"
            initial={{ width: "0%" }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
        {isComplete && (
          <div className="absolute inset-0 bg-emerald-400" />
        )}
        {isFailed && (
          <div className="absolute inset-0 bg-red-300" />
        )}
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <p className={`text-[10px] font-medium ${
          isComplete ? "text-emerald-600" : isFailed ? "text-red-500" : "text-gray-400"
        }`}>
          {stageLabel}
        </p>
        {isActive && (
          <span className="text-[10px] tabular-nums font-semibold text-gray-400">
            {displayProgress}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface AnimationQueueProps {
  onViewResult?: (job: QueuedAnimation) => void;
}

export function AnimationQueue({ onViewResult }: AnimationQueueProps) {
  const jobs = useAnimationQueue((s) => s.jobs);
  const removeJob = useAnimationQueue((s) => s.removeJob);

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
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
