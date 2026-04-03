"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationQueue, type QueuedGeneration } from "@/stores/useGenerationQueue";

const GEN_STAGES = [
  { at: 0, msg: "Preparing..." },
  { at: 15, msg: "Generating image..." },
  { at: 50, msg: "Processing..." },
  { at: 80, msg: "Uploading..." },
  { at: 100, msg: "Complete" },
];

function useGenProgress(startedAt: number, active: boolean) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!active) { setProgress(100); return; }

    function tick() {
      const elapsed = (Date.now() - startedAt) / 1000;
      let v: number;
      if (elapsed < 1) v = 15 * elapsed;
      else if (elapsed < 4) v = 15 + 35 * ((elapsed - 1) / 3);
      else if (elapsed < 8) v = 50 + 30 * ((elapsed - 4) / 4);
      else if (elapsed < 15) v = 80 + 15 * ((elapsed - 8) / 7);
      else v = 95 + 4 * (1 - Math.exp(-(elapsed - 15) / 10));
      setProgress(Math.min(v, 99));
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [startedAt, active]);

  const stage = GEN_STAGES.reduce(
    (acc, s) => (progress >= s.at ? s.msg : acc),
    GEN_STAGES[0].msg,
  );

  return { progress: Math.round(active ? progress : 100), stage };
}

function GenCard({
  job,
  onDismiss,
}: {
  job: QueuedGeneration;
  onDismiss: (id: string) => void;
}) {
  const isActive = job.status === "generating";
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";
  const { progress, stage } = useGenProgress(job.startedAt, isActive);

  const styleName = job.style.charAt(0).toUpperCase() + job.style.slice(1);

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
        {isComplete && job.imageUrl ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
            <Image
              src={job.imageUrl}
              alt={job.prompt}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </div>
        ) : (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isFailed ? "bg-red-50" : "bg-gray-50"
          }`}>
            <svg className={`h-5 w-5 ${isFailed ? "text-red-300" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500">
              {styleName}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-gray-400">
            {job.prompt}
          </p>
        </div>

        {(isComplete || isFailed) && (
          <button
            onClick={() => onDismiss(job.id)}
            className="shrink-0 rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-gray-100">
        {isActive && (
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-400 to-orange-400"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
        {isComplete && <div className="absolute inset-0 bg-emerald-400" />}
        {isFailed && <div className="absolute inset-0 bg-red-300" />}
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <p className={`text-[10px] font-medium ${
          isComplete ? "text-emerald-600" : isFailed ? "text-red-500" : "text-gray-400"
        }`}>
          {isComplete ? "Complete" : isFailed ? (job.error || "Failed") : stage}
        </p>
        {isActive && (
          <span className="text-[10px] tabular-nums font-semibold text-gray-400">{progress}%</span>
        )}
      </div>
    </motion.div>
  );
}

export function GenerationQueue() {
  const jobs = useGenerationQueue((s) => s.jobs);
  const removeJob = useGenerationQueue((s) => s.removeJob);
  const clearCompleted = useGenerationQueue((s) => s.clearCompleted);

  if (jobs.length === 0) return null;

  const completedCount = jobs.filter((j) => j.status !== "generating").length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Generation Queue
        </p>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gray-500">
            {jobs.filter((j) => j.status === "generating").length} active
          </span>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-[10px] font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              Clear done
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {jobs.map((job) => (
            <GenCard key={job.id} job={job} onDismiss={removeJob} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
