"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import type { BuilderConfig, BuilderCategory, ChipOption } from "./configs";

interface Suggestion {
  title: string;
  prompt: string;
}

interface PromptBuilderProps {
  config: BuilderConfig;
  style?: string;
  onDraftChange: (draft: string) => void;
  onSelectSuggestion: (prompt: string) => void;
}

export function PromptBuilder({
  config,
  style,
  onDraftChange,
  onSelectSuggestion,
}: PromptBuilderProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [selectionLabels, setSelectionLabels] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const { user, openAuthModal } = useAppStore();

  const draft = useMemo(
    () => config.assembleDraft(selections, extras),
    [config, selections, extras],
  );

  useEffect(() => {
    onDraftChange(draft);
  }, [draft, onDraftChange]);

  const visibleCategories = useMemo(() => {
    return config.categories.filter((cat) => {
      if (!cat.showWhen) return true;
      const parentVal = selections[cat.showWhen.categoryId];
      return parentVal != null && cat.showWhen.keys.includes(parentVal);
    });
  }, [config.categories, selections]);

  const activeStepIndex = useMemo(() => {
    if (expandedStep !== null) {
      const idx = visibleCategories.findIndex((c) => c.id === expandedStep);
      if (idx >= 0) return idx;
    }
    for (let i = 0; i < visibleCategories.length; i++) {
      if (!selections[visibleCategories[i].id]) return i;
    }
    return visibleCategories.length;
  }, [visibleCategories, selections, expandedStep]);

  const allStepsComplete = activeStepIndex >= visibleCategories.length;

  const handleChipSelect = useCallback(
    (categoryId: string, chip: ChipOption) => {
      setSelections((prev) => {
        const next = { ...prev };
        if (next[categoryId] === chip.key) {
          delete next[categoryId];
          if (categoryId === "subject") delete next.specific;
        } else {
          next[categoryId] = chip.key;
          if (categoryId === "subject") delete next.specific;
        }
        return next;
      });
      setSelectionLabels((prev) => ({ ...prev, [categoryId]: chip.label }));
      setExpandedStep(null);
      setSuggestions([]);
    },
    [],
  );

  const handleEditStep = useCallback((categoryId: string) => {
    setExpandedStep(categoryId);
    setSuggestions([]);
  }, []);

  const completedSteps = useMemo(() => {
    const result: { category: BuilderCategory; chip: ChipOption }[] = [];
    for (const cat of visibleCategories) {
      const val = selections[cat.id];
      if (val) {
        const chip = cat.chips.find((c) => c.key === val);
        if (chip) result.push({ category: cat, chip });
      }
    }
    return result;
  }, [visibleCategories, selections]);

  const fetchSuggestions = useCallback(async () => {
    if (!draft.trim()) return;
    if (!user) {
      openAuthModal("signup");
      return;
    }
    setLoading(true);
    setError(false);
    setSuggestions([]);
    try {
      const res = await fetch("/api/create/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: config.contentType,
          draft: draft.trim(),
          style: style || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [draft, config.contentType, style, user, openAuthModal]);

  return (
    <div className="py-4">
      {/* Section divider */}
      <div className="flex items-center gap-3 pb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-gray-400">
          <svg className="h-3.5 w-3.5 text-pink-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          Prompt Builder
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Completed steps breadcrumb */}
      {completedSteps.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {completedSteps.map(({ category, chip }, i) => {
            const isEditing = expandedStep === category.id;
            return (
              <span key={`${category.id}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && (
                  <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <button
                  onClick={() => handleEditStep(category.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isEditing
                      ? "border border-pink-200 bg-pink-50 text-pink-600"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              </span>
            );
          })}
          {completedSteps.length > 0 && (
            <button
              onClick={() => {
                setSelections({});
                setSelectionLabels({});
                setExtras("");
                setExpandedStep(null);
                setSuggestions([]);
              }}
              className="ml-1 text-[11px] text-gray-400 transition-colors hover:text-gray-600"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Live prompt preview */}
      {draft && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-5 overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white"
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-pink-400 to-orange-400" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Your prompt
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-700">
                {draft}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active step */}
      <AnimatePresence mode="wait">
        {!allStepsComplete && visibleCategories[activeStepIndex] && (
          <motion.div
            key={`step-${visibleCategories[activeStepIndex].id}-${activeStepIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <StepCard
              category={visibleCategories[activeStepIndex]}
              selectedKey={selections[visibleCategories[activeStepIndex].id]}
              stepNumber={completedSteps.length + 1}
              totalSteps={visibleCategories.length}
              onSelect={(chip) => handleChipSelect(visibleCategories[activeStepIndex].id, chip)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extras + Polish section (after all chip steps done) */}
      {allStepsComplete && draft && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Extras input */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Anything else to add?
            </p>
            <input
              type="text"
              value={extras}
              onChange={(e) => {
                setExtras(e.target.value);
                setSuggestions([]);
              }}
              placeholder={config.extrasPlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-350 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-200"
            />
          </div>

          {/* Polish with AI card */}
          {suggestions.length === 0 && !loading && (
            <button
              onClick={fetchSuggestions}
              className="group w-full rounded-xl border border-dashed border-pink-200 bg-gradient-to-r from-pink-50/80 to-orange-50/60 p-5 text-left transition-all hover:border-pink-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-pink-600">
                      Polish with AI
                    </p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Free
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Get 4 creative variations of your prompt, or just hit Create
                  </p>
                </div>
                <svg className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
            <p className="text-sm font-medium text-gray-500">
              Polishing your prompt...
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-orange-400"
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Something went wrong.{" "}
            <button
              onClick={fetchSuggestions}
              className="font-semibold underline hover:no-underline"
            >
              Try again
            </button>
          </p>
        </div>
      )}

      {/* Suggestion cards */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">
              Pick a polished version
            </p>
            <button
              onClick={fetchSuggestions}
              disabled={loading}
              className="text-[11px] font-medium text-pink-500 transition-colors hover:text-pink-700 disabled:opacity-50"
            >
              Regenerate
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelectSuggestion(s.prompt);
                  setSuggestions([]);
                }}
                className="group rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
              >
                <p className="text-xs font-bold text-gray-700 group-hover:text-pink-600">
                  {s.title}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 line-clamp-3">
                  {s.prompt}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepCard -- a single builder step with question heading and emoji cards
// ---------------------------------------------------------------------------

function StepCard({
  category,
  selectedKey,
  stepNumber,
  totalSteps,
  onSelect,
}: {
  category: BuilderCategory;
  selectedKey?: string;
  stepNumber: number;
  totalSteps: number;
  onSelect: (chip: ChipOption) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">
          {category.question}
        </h3>
        <span className="text-[11px] font-medium text-gray-300">
          {stepNumber} / {totalSteps}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {category.chips.map((chip) => {
          const isActive = selectedKey === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => onSelect(chip)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "border border-gray-150 bg-gray-50 text-gray-600 hover:-translate-y-0.5 hover:border-gray-200 hover:bg-white hover:shadow-sm"
              }`}
            >
              <span className="text-base">{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
