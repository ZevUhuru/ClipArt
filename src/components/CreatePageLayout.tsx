"use client";

import { type ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateMobileHeader } from "./CreateMobileHeader";
import { PromptInput } from "./PromptInput";
import { GenerationQueue } from "./GenerationQueue";
import { useGenerationQueue } from "@/stores/useGenerationQueue";

interface CreatePageLayoutProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  promptPlaceholder?: string;
  submitDisabled?: boolean;
  /** Slot rendered inline inside the command bar (style chip, public toggle, etc.) */
  options: ReactNode;
  error: string | null;
  children: ReactNode;
}

export function CreatePageLayout({
  prompt,
  onPromptChange,
  onSubmit,
  promptPlaceholder,
  submitDisabled = false,
  options,
  error,
  children,
}: CreatePageLayoutProps) {
  const queueJobs = useGenerationQueue((s) => s.jobs);
  const [compactDesktopBar, setCompactDesktopBar] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");

    function updateCompactState() {
      setCompactDesktopBar(media.matches && window.scrollY > 40);
    }

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });
    media.addEventListener("change", updateCompactState);

    return () => {
      window.removeEventListener("scroll", updateCompactState);
      media.removeEventListener("change", updateCompactState);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden sm:overflow-x-visible">
      <div
        className={`fixed inset-x-0 top-0 z-50 border-b border-gray-900/10 bg-[#1c1c27] shadow-xl shadow-gray-900/10 transition-all duration-200 sm:sticky sm:inset-auto sm:top-0 sm:z-40 sm:border-0 sm:shadow-none ${
          compactDesktopBar
            ? "sm:bg-white/78 sm:backdrop-blur-xl sm:ring-1 sm:ring-gray-200/70"
            : "sm:bg-transparent"
        }`}
      >
        <div className="mx-auto w-full max-w-5xl px-4">
          {/* Mobile: brand + content-type selector. Hidden on desktop. */}
          <div className="sm:hidden">
            <CreateMobileHeader />
          </div>
          {/* Mobile command bar row. */}
          <div className="pb-6 pt-3 sm:hidden">
            <PromptInput
              value={prompt}
              onChange={onPromptChange}
              onSubmit={onSubmit}
              placeholder={promptPlaceholder}
              disabled={submitDisabled}
              optionsSlot={options}
            />
          </div>
          {/* Desktop command surface. */}
          <div className={`hidden transition-all duration-200 sm:block ${compactDesktopBar ? "py-2" : "py-5"}`}>
            <div
              className={`relative overflow-visible border border-white/70 bg-white/85 shadow-xl ring-1 ring-gray-200/60 backdrop-blur-xl transition-all duration-200 ${
                compactDesktopBar
                  ? "rounded-2xl p-2.5 shadow-gray-200/40"
                  : "rounded-[2rem] p-4 shadow-gray-200/60"
              }`}
            >
              <div className={`${compactDesktopBar ? "hidden" : "mb-3 flex"} items-end justify-between gap-4 px-1`}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-pink-500/70">
                    Studio
                  </p>
                  <h1 className="font-futura text-2xl font-black tracking-tight text-gray-950">
                    Create
                  </h1>
                </div>
                <p className="hidden max-w-sm text-right text-xs font-medium leading-snug text-gray-400 md:block">
                  Describe the asset, choose a style, and generate artwork in one focused command bar.
                </p>
              </div>
              <PromptInput
                value={prompt}
                onChange={onPromptChange}
                onSubmit={onSubmit}
                placeholder={promptPlaceholder}
                disabled={submitDisabled}
                optionsSlot={options}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-[18.25rem] sm:hidden" aria-hidden="true" />

      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        {queueJobs.length > 0 && (
          <div className="mb-6">
            <GenerationQueue />
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {children}
      </div>
    </div>
  );
}
