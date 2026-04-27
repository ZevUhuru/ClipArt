"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppToolbar } from "./AppToolbar";
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
      <div className="sticky top-0 z-50 border-b border-gray-900/10 bg-[#1c1c27] shadow-xl shadow-gray-900/10 sm:z-20 sm:border-gray-100 sm:bg-white/80 sm:shadow-none sm:backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4">
          {/* Mobile: brand + content-type selector. Hidden on desktop. */}
          <div className="sm:hidden">
            <CreateMobileHeader />
          </div>
          {/* Desktop menubar row. Hidden on mobile. */}
          <div className="hidden h-10 items-center border-b border-gray-100/60 sm:flex">
            <AppToolbar />
          </div>
          {/* Command bar row */}
          <div className="pb-4 pt-1 sm:py-3">
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
