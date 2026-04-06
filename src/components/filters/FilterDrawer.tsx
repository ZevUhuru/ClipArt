"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilterChipRow, type ChipItem } from "./FilterChipRow";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryItems: ChipItem[];
  styleItems: ChipItem[];
  activeCategory: string | null;
  activeStyle: string | null;
  onCategorySelect: (key: string | null) => void;
  onStyleSelect: (key: string | null) => void;
  onReset: () => void;
  showStyles?: boolean;
}

export function FilterDrawer({
  isOpen,
  onClose,
  categoryItems,
  styleItems,
  activeCategory,
  activeStyle,
  onCategorySelect,
  onStyleSelect,
  onReset,
  showStyles = true,
}: FilterDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex justify-center bg-white pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="space-y-6 px-5 pb-8" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                <button
                  onClick={onReset}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600"
                >
                  Reset all
                </button>
              </div>

              {categoryItems.length > 0 && (
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Category
                  </p>
                  <FilterChipRow
                    items={categoryItems}
                    activeKey={activeCategory}
                    onSelect={onCategorySelect}
                    showAll
                    size="sm"
                  />
                </div>
              )}

              {showStyles && styleItems.length > 0 && (
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Style
                  </p>
                  <FilterChipRow
                    items={styleItems}
                    activeKey={activeStyle}
                    onSelect={onStyleSelect}
                    showAll
                    size="sm"
                  />
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                Show results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
