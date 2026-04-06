"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChipItem {
  key: string;
  label: string;
  indicator?: React.ReactNode;
}

interface FilterChipRowProps {
  items: ChipItem[];
  activeKey: string | null;
  onSelect: (key: string | null) => void;
  maxVisible?: number;
  allLabel?: string;
  showAll?: boolean;
  size?: "sm" | "md";
}

export function FilterChipRow({
  items,
  activeKey,
  onSelect,
  maxVisible = 8,
  allLabel,
  showAll = false,
  size = "md",
}: FilterChipRowProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleItems = expanded || showAll ? items : items.slice(0, maxVisible);
  const hiddenCount = items.length - maxVisible;
  const canExpand = !showAll && hiddenCount > 0;

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1 text-xs"
    : "px-3.5 py-1.5 text-sm";

  const chipBase = `shrink-0 rounded-full font-medium transition-all duration-150 ${sizeClasses}`;
  const chipActive = "bg-gray-900 text-white shadow-sm";
  const chipInactive = "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]";

  return (
    <motion.div
      layout
      className="flex flex-wrap items-center gap-2"
      transition={{ duration: 0.2 }}
    >
      {allLabel && (
        <button
          onClick={() => onSelect(null)}
          className={`${chipBase} ${!activeKey ? chipActive : chipInactive}`}
        >
          {allLabel}
        </button>
      )}

      <AnimatePresence initial={false}>
        {visibleItems.map((item) => (
          <motion.button
            key={item.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelect(activeKey === item.key ? null : item.key)}
            className={`${chipBase} inline-flex items-center gap-1.5 ${
              activeKey === item.key ? chipActive : chipInactive
            }`}
          >
            {item.indicator}
            {item.label}
          </motion.button>
        ))}
      </AnimatePresence>

      {canExpand && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={`${chipBase} border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500`}
        >
          +{hiddenCount} more
        </button>
      )}

      {canExpand && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className={`${chipBase} text-gray-400 hover:text-gray-500`}
        >
          Show less
        </button>
      )}
    </motion.div>
  );
}
