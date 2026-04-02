"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Submitting to animation queue…",
  "Waiting in queue…",
  "Generating frames…",
  "Rendering final video…",
  "Almost there…",
];

const MESSAGE_THRESHOLDS = [0, 10, 20, 75, 92];

function getMessageIndex(progress: number): number {
  for (let i = MESSAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (progress >= MESSAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

function useSimulatedProgress(isAnimating: boolean) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

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
  }, []);

  useEffect(() => {
    if (isAnimating) {
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
  }, [isAnimating, isVisible, tick]);

  const messageIndex = getMessageIndex(progress);
  return { progress, messageIndex, isVisible };
}

interface AnimationProgressProps {
  isAnimating: boolean;
}

export function AnimationProgress({ isAnimating }: AnimationProgressProps) {
  const { progress, messageIndex, isVisible } = useSimulatedProgress(isAnimating);
  const currentMessage = MESSAGES[messageIndex];
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
            <div className="flex items-center gap-3 px-5 pb-2 pt-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
                <svg
                  className={`h-4.5 w-4.5 text-white ${isComplete ? "" : "animate-pulse-soft"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125" />
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
                {!isComplete && (
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Animations typically take 1–2 minutes
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-400">
                {displayPercent}%
              </span>
            </div>

            <div className="px-5 pb-5 pt-2">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full bg-brand-gradient"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    duration: isComplete ? 0.3 : 0.8,
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
