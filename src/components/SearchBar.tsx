"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  placeholders?: string[];
  isLoading?: boolean;
  defaultValue?: string;
}

const ROTATE_INTERVAL = 3200;

export function SearchBar({
  onSearch,
  placeholder,
  placeholders,
  isLoading = false,
  defaultValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePlaceholders = placeholders && placeholders.length > 0 ? placeholders : null;
  const currentPlaceholder = activePlaceholders
    ? activePlaceholders[placeholderIdx % activePlaceholders.length]
    : placeholder || "Search clip art...";

  useEffect(() => {
    if (!activePlaceholders || isFocused || value) return;
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % activePlaceholders.length),
      ROTATE_INTERVAL,
    );
    return () => clearInterval(id);
  }, [activePlaceholders, isFocused, value]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !isFocused && !isInputTarget(e)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFocused]);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(query), 350);
    },
    [onSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    debouncedSearch(q);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(value);
  }

  function handleClear() {
    setValue("");
    onSearch("");
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`
          relative flex items-center rounded-xl
          transition-all duration-200
          ${isFocused
            ? "bg-white shadow-lg shadow-gray-200/50 ring-1 ring-gray-200"
            : "bg-gray-100/80 hover:bg-gray-200/60"
          }
        `}
      >
        <div className="pointer-events-none absolute left-4 text-brand-400">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={currentPlaceholder}
          className="w-full bg-transparent py-3.5 pl-11 pr-20 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
          aria-label="Search"
        />

        <div className="absolute right-3.5 flex items-center gap-2">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {value && (
              <motion.button
                type="button"
                onClick={handleClear}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors hover:bg-gray-300 hover:text-gray-700"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {!value && !isFocused && (
            <kbd className="hidden select-none items-center rounded border border-gray-200/60 bg-white/60 px-1.5 py-0.5 text-[11px] font-medium text-gray-400 sm:inline-flex">
              /
            </kbd>
          )}
        </div>
      </div>
    </form>
  );
}

function isInputTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
}
