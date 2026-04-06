"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ActiveFilter {
  key: string;
  label: string;
  type: "category" | "style" | "query";
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (type: "category" | "style" | "query") => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      <AnimatePresence mode="popLayout">
        {filters.map((f) => (
          <motion.button
            key={f.key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
            onClick={() => onRemove(f.type)}
            className="group inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-700"
          >
            <span className="max-w-[150px] truncate">{f.label}</span>
            <svg
              className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        ))}
      </AnimatePresence>

      {filters.length >= 2 && (
        <button
          onClick={onClearAll}
          className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
        >
          Clear all
        </button>
      )}
    </motion.div>
  );
}
