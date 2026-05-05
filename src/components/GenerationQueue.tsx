"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationQueue, type QueuedGeneration } from "@/stores/useGenerationQueue";
import { useImageDrawer, type DrawerImage } from "@/stores/useImageDrawer";

const GEN_STAGES = [
  { at: 0, msg: "Preparing..." },
  { at: 15, msg: "Generating..." },
  { at: 50, msg: "Processing..." },
  { at: 80, msg: "Uploading..." },
  { at: 100, msg: "Complete" },
];

function getGenProgress(startedAt: number, active: boolean, now = Date.now()) {
  if (!active) {
    return { progress: 100, stage: "Complete", isFinalizing: false };
  }

  const elapsed = (now - startedAt) / 1000;
  let value: number;
  if (elapsed < 1) value = 15 * elapsed;
  else if (elapsed < 4) value = 15 + 35 * ((elapsed - 1) / 3);
  else if (elapsed < 8) value = 50 + 30 * ((elapsed - 4) / 4);
  else if (elapsed < 15) value = 80 + 15 * ((elapsed - 8) / 7);
  else value = 95 + 4 * (1 - Math.exp(-(elapsed - 15) / 10));

  const progress = Math.min(Math.round(value), 99);
  const isFinalizing = progress >= 99;
  const stage = isFinalizing
    ? "Almost ready..."
    : GEN_STAGES.reduce(
        (acc, s) => (progress >= s.at ? s.msg : acc),
        GEN_STAGES[0].msg,
      );

  return { progress, stage, isFinalizing };
}

function useGenProgress(startedAt: number, active: boolean) {
  const [snapshot, setSnapshot] = useState(() => getGenProgress(startedAt, active));
  const raf = useRef(0);

  useEffect(() => {
    if (!active) {
      setSnapshot(getGenProgress(startedAt, false));
      return;
    }

    function tick() {
      setSnapshot(getGenProgress(startedAt, true));
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [startedAt, active]);

  return snapshot;
}

const CARD_SIZE = 80;
const RING_R = 10;
const RING_CIRC = 2 * Math.PI * RING_R;

function GenCard({
  job,
  onDismiss,
  onPreview,
}: {
  job: QueuedGeneration;
  onDismiss: (id: string) => void;
  onPreview: (job: QueuedGeneration) => void;
}) {
  const isActive = job.status === "generating";
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";
  const { progress, stage, isFinalizing } = useGenProgress(job.startedAt, isActive);

  const styleName = job.style.charAt(0).toUpperCase() + job.style.slice(1);
  const strokeDash = (progress / 100) * RING_CIRC;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={() => isComplete && job.imageUrl && onPreview(job)}
      className={`group relative shrink-0 overflow-hidden rounded-xl border transition-all ${
        isComplete
          ? "cursor-pointer border-emerald-200 hover:scale-[1.04] hover:ring-2 hover:ring-pink-400/40"
          : isFailed
            ? "border-red-200"
            : "border-gray-200"
      }`}
      style={{ width: CARD_SIZE, height: CARD_SIZE }}
    >
      {/* Completed: thumbnail */}
      {isComplete && job.imageUrl && (
        <>
          {job.hasTransparency && <div className="absolute inset-0 bg-transparency-grid" />}
          <Image
            src={job.imageUrl}
            alt={job.prompt}
            fill
            className={job.hasTransparency ? "object-contain p-1.5" : "object-cover"}
            sizes={`${CARD_SIZE}px`}
            unoptimized
          />
          {/* Expand icon on hover */}
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </span>
        </>
      )}

      {/* Generating: pulse + progress ring */}
      {isActive && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50">
          <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
            <circle cx="14" cy="14" r={RING_R} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
            <circle
              cx="14" cy="14" r={RING_R} fill="none"
              stroke="url(#progGrad)" strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${RING_CIRC}`}
              className="transition-[stroke-dasharray] duration-500 ease-out"
            />
            <defs>
              <linearGradient id="progGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f472b6" />
                <stop offset="1" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
          <span className="mt-1 text-[9px] font-semibold tabular-nums text-gray-400">{progress}%</span>
        </div>
      )}

      {/* Failed: error icon */}
      {isFailed && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-red-50/60">
          <svg className="h-5 w-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="mt-0.5 text-[8px] font-medium text-red-400">Failed</span>
        </div>
      )}

      {/* Style pill (generating / failed) */}
      {!isComplete && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/30 px-1.5 py-px text-[7px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {isActive && isFinalizing ? stage : styleName}
        </span>
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
    </motion.div>
  );
}

export function GenerationQueue() {
  const jobs = useGenerationQueue((s) => s.jobs);
  const removeJob = useGenerationQueue((s) => s.removeJob);
  const clearCompleted = useGenerationQueue((s) => s.clearCompleted);
  const openDrawer = useImageDrawer((s) => s.open);
  const hasActiveJobs = jobs.some((j) => j.status === "generating");
  const [queueNow, setQueueNow] = useState(() => Date.now());

  useEffect(() => {
    if (!hasActiveJobs) return;

    const interval = window.setInterval(() => setQueueNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveJobs]);

  const completedDrawerList = useMemo<DrawerImage[]>(
    () =>
      jobs
        .filter((j) => j.status === "completed" && j.imageUrl)
        .map((j) => ({
          id: j.generationId || j.id,
          slug: j.generationId || j.id,
          title: j.title || "",
          prompt: j.prompt,
          url: j.imageUrl!,
          category: "free",
          style: j.style,
          content_type: j.contentType,
          model: j.model,
          has_transparency: j.hasTransparency,
        })),
    [jobs],
  );

  const handlePreview = (job: QueuedGeneration) => {
    const img: DrawerImage = {
      id: job.generationId || job.id,
      slug: job.generationId || job.id,
      title: job.title || "",
      url: job.imageUrl!,
      category: "free",
      style: job.style,
      prompt: job.prompt,
      content_type: job.contentType,
      model: job.model,
      has_transparency: job.hasTransparency,
    };
    openDrawer(img, completedDrawerList, true);
  };

  if (jobs.length === 0) return null;

  const activeCount = jobs.filter((j) => j.status === "generating").length;
  const completedCount = jobs.filter((j) => j.status !== "generating").length;
  const finalizingCount = jobs.filter(
    (j) => j.status === "generating" && getGenProgress(j.startedAt, true, queueNow).isFinalizing,
  ).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Generation Queue
        </p>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gray-500">
            {activeCount} active
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

      <AnimatePresence>
        {finalizingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-2 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-800 shadow-sm"
          >
            <span className="font-bold">Almost ready.</span>{" "}
            Your image is finishing processing and should appear here soon.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="popLayout">
          {jobs.map((job) => (
            <GenCard key={job.id} job={job} onDismiss={removeJob} onPreview={handlePreview} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
