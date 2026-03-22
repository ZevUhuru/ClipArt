"use client";

import { STYLES, type StyleKey } from "@/lib/styles";

interface StylePickerProps {
  selected: StyleKey;
  onSelect: (style: StyleKey) => void;
}

const styleLabels: Record<StyleKey, string> = {
  flat: "Flat",
  outline: "Outline",
  cartoon: "Cartoon",
  sticker: "Sticker",
  vintage: "Vintage",
  watercolor: "Watercolor",
};

export function StylePicker({ selected, onSelect }: StylePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(STYLES) as StyleKey[]).map((key) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selected === key
              ? "bg-brand-gradient text-white shadow-md"
              : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {styleLabels[key]}
        </button>
      ))}
    </div>
  );
}
