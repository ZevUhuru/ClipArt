"use client";

import { STYLES, type StyleKey } from "@/lib/styles";

const CLIP_ART_STYLES: StyleKey[] = ["flat", "outline", "cartoon", "sticker", "vintage", "watercolor"];

interface StylePickerProps {
  selected: StyleKey;
  onSelect: (style: StyleKey) => void;
  styles?: StyleKey[];
}

const styleLabels: Record<StyleKey, string> = {
  flat: "Flat",
  outline: "Outline",
  cartoon: "Cartoon",
  sticker: "Sticker",
  vintage: "Vintage",
  watercolor: "Watercolor",
  coloring: "Coloring Page",
};

export function StylePicker({ selected, onSelect, styles = CLIP_ART_STYLES }: StylePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((key) => (
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
