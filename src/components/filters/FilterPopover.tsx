"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ChipItem } from "./FilterChipRow";

interface FilterPopoverProps {
  label: string;
  items: ChipItem[];
  activeKey: string | null;
  onSelect: (key: string | null) => void;
  allLabel?: string;
  hideAll?: boolean;
}

export function FilterPopover({
  label,
  items,
  activeKey,
  onSelect,
  allLabel = "All",
  hideAll = false,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeItem = activeKey ? items.find((i) => i.key === activeKey) : null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, close]);

  function handleSelect(key: string | null) {
    onSelect(key);
    close();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
          transition-colors duration-150
          ${activeItem
            ? "bg-gray-900 text-white"
            : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }
        `}
      >
        {activeItem?.indicator}
        <span>{activeItem ? activeItem.label : label}</span>
        <svg
          className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""} ${activeItem ? "text-white/60" : "text-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-40 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {!hideAll && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    !activeKey ? "bg-gray-50 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {allLabel}
                </button>
              )}

              {items.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelect(item.key)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.indicator}
                    <span>{item.label}</span>
                    {isActive && (
                      <svg className="ml-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
