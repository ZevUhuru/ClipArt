"use client";

import { useState } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  buttonLabel?: string;
}

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

  return (
    <div className="flex gap-3">
      <div
        className={`
          relative flex flex-1 items-center rounded-xl
          transition-all duration-200
          ${isFocused
            ? "bg-white shadow-lg shadow-gray-200/50 ring-1 ring-gray-200"
            : "bg-gray-100/80 hover:bg-gray-200/60"
          }
        `}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3.5 px-4 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
          maxLength={maxLength}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
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
