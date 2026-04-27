"use client";

import { type ReactNode } from "react";
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

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="sticky top-0 z-50 border-b border-gray-900/10 bg-[#1c1c27] shadow-xl shadow-gray-900/10 sm:z-20 sm:border-0 sm:bg-transparent sm:shadow-none">
        <div className="mx-auto w-full max-w-5xl px-4">
          {/* Mobile: brand + content-type selector. Hidden on desktop. */}
          <div className="sm:hidden">
            <CreateMobileHeader />
          </div>
          {/* Mobile command bar row. */}
          <div className="pb-4 pt-1 sm:hidden">
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
          <div className="hidden py-5 sm:block">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/60 backdrop-blur-xl">
              <div className="mb-3 flex items-end justify-between gap-4 px-1">
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
