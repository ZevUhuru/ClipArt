"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CLIPART_MESSAGES = [
  "Analyzing your prompt…",
  "Generating artwork…",
  "Adding details…",
  "Applying final touches…",
  "Almost there…",
];

const COLORING_MESSAGES = [
  "Analyzing your prompt…",
  "Drawing outlines…",
  "Refining line art…",
  "Applying final touches…",
  "Almost there…",
];

const MESSAGE_THRESHOLDS = [0, 15, 50, 80, 95];

function getMessageIndex(progress: number): number {
  for (let i = MESSAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (progress >= MESSAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

function useSimulatedProgress(isGenerating: boolean) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    let value: number;
    if (elapsed < 3) {
      // Phase 1: fast ramp to ~60%
      value = 60 * (1 - Math.pow(1 - elapsed / 3, 2.5));
    } else if (elapsed < 8) {
      // Phase 2: moderate pace 60% -> 85%
      value = 60 + 25 * ((elapsed - 3) / 5);
    } else if (elapsed < 15) {
      // Phase 3: slow crawl 85% -> 95%
      value = 85 + 10 * ((elapsed - 8) / 7);
    } else {
      // Phase 4: very slow trickle, asymptotically approaching 99%
      value = 95 + 4 * (1 - Math.exp(-(elapsed - 15) / 10));
    }

    setProgress(Math.min(value, 99));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isGenerating) {
      setProgress(0);
      setIsVisible(true);
      startTimeRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    } else if (isVisible) {
      cancelAnimationFrame(rafRef.current);
      setProgress(100);
      const timer = setTimeout(() => setIsVisible(false), 600);
      return () => clearTimeout(timer);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isGenerating, isVisible, tick]);

  const messageIndex = getMessageIndex(progress);

  return { progress, messageIndex, isVisible };
}

interface GenerationProgressProps {
  isGenerating: boolean;
  variant?: "clipart" | "coloring";
}

export function GenerationProgress({
  isGenerating,
  variant = "clipart",
}: GenerationProgressProps) {
  const { progress, messageIndex, isVisible } = useSimulatedProgress(isGenerating);
  const messages = variant === "coloring" ? COLORING_MESSAGES : CLIPART_MESSAGES;
  const currentMessage = messages[messageIndex];
  const displayPercent = Math.round(progress);
  const isComplete = progress === 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto w-full max-w-md"
        >
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-lg shadow-gray-200/40 backdrop-blur-sm">
            {/* Sparkle icon + message */}
            <div className="flex items-center gap-3 px-5 pb-2 pt-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
                <svg
                  className={`h-4.5 w-4.5 text-white ${isComplete ? "" : "animate-pulse-soft"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessage}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-gray-800"
                  >
                    {isComplete ? "Done!" : currentMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-400">
                {displayPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-5 pt-2">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full bg-brand-gradient"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    duration: isComplete ? 0.3 : 0.4,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
