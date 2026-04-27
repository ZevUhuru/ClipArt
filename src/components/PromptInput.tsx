"use client";

import { type ReactNode, useState, useRef, useCallback, useEffect } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  buttonLabel?: string;
  /** Slot rendered inline between the textarea and the Create button — style chip, public toggle, etc. */
  optionsSlot?: ReactNode;
}

const MAX_HEIGHT = 160;

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe what you want to create...",
  disabled = false,
  maxLength = 2000,
  buttonLabel = "Create",
  optionsSlot,
}: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Unified input container — vertical stack on mobile (textarea on top,
          options + Create button on a quiet divider row below) so nothing
          fights for horizontal space. Desktop (sm+) collapses to a single row. */}
      <div
        className={`
          relative flex w-full min-w-0 flex-col rounded-2xl sm:flex-1 sm:flex-row sm:items-center sm:rounded-xl
          transition-all duration-200
          ${isFocused
            ? "bg-white shadow-lg shadow-black/20 ring-1 ring-white/70 sm:shadow-gray-200/50 sm:ring-gray-200"
            : "bg-white/95 shadow-lg shadow-black/15 ring-1 ring-white/60 hover:bg-white sm:bg-gray-100/80 sm:shadow-none sm:ring-0 sm:hover:bg-gray-200/60"
          }
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          // min-h on mobile reserves room for a 2-line placeholder so it never
          // bleeds into the options row below; auto-resize still grows from
          // there via the resize() effect.
          className="min-h-[4.25rem] w-full min-w-0 flex-1 resize-none bg-transparent px-4 pt-3.5 pb-1 text-[16px] leading-snug text-gray-950 placeholder:text-gray-500 outline-none transition-[height] duration-150 sm:min-h-0 sm:py-3.5 sm:pr-3 sm:text-[15px]"
          style={{ maxHeight: MAX_HEIGHT, overflowY: textareaRef.current && textareaRef.current.scrollHeight > MAX_HEIGHT ? "auto" : "hidden" }}
          maxLength={maxLength}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />

        {/* Mobile bottom row — visually separated from the textarea by a soft
            divider so options don't appear to overlap with placeholder text.
            Options on the left (scrollable if they overflow), Create on right. */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-200/80 px-2 py-2 sm:hidden">
          {optionsSlot ? (
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {optionsSlot}
            </div>
          ) : (
            <span />
          )}
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="shrink-0 rounded-lg bg-brand-gradient px-4 py-1.5 text-[13px] font-bold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>

        {/* Desktop inline options (textarea + options chips on one row). */}
        {optionsSlot && (
          <div className="hidden shrink-0 items-center gap-1 pr-2 sm:flex">
            {optionsSlot}
          </div>
        )}
      </div>

      {/* Desktop-only Create button alongside the input. */}
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="hidden shrink-0 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:block"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
