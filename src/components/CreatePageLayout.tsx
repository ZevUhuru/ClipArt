"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppToolbar } from "./AppToolbar";
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
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4">
          {/* Menubar row */}
          <div className="flex h-10 items-center border-b border-gray-100/60">
            <AppToolbar />
          </div>
          {/* Command bar row */}
          <div className="py-3">
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

      <div className="mx-auto max-w-5xl px-4 py-6">
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
