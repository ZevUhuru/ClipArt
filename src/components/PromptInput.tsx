"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  buttonLabel?: string;
}

const MAX_HEIGHT = 160;

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe what you want to create...",
  disabled = false,
  maxLength = 1000,
  buttonLabel = "Create",
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
    <div className="flex items-end gap-3">
      <div
        className={`
          relative flex flex-1 rounded-xl
          transition-all duration-200
          ${isFocused
            ? "bg-white shadow-lg shadow-gray-200/50 ring-1 ring-gray-200"
            : "bg-gray-100/80 hover:bg-gray-200/60"
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
          className="w-full resize-none bg-transparent py-3.5 px-4 text-[15px] leading-snug text-gray-900 placeholder-gray-400 outline-none transition-[height] duration-150"
          style={{ maxHeight: MAX_HEIGHT, overflowY: textareaRef.current && textareaRef.current.scrollHeight > MAX_HEIGHT ? "auto" : "hidden" }}
          maxLength={maxLength}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="shrink-0 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
