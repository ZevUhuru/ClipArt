"use client";

import { type StyleKey } from "@/lib/styles";

const CLIP_ART_STYLES: StyleKey[] = [
  "flat", "outline", "cartoon", "sticker", "vintage", "watercolor",
  "chibi", "pixel", "kawaii", "3d", "doodle",
];

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
  chibi: "Chibi",
  pixel: "Pixel Art",
  kawaii: "Kawaii",
  "3d": "3D Render",
  doodle: "Doodle",
  coloring: "Coloring Page",
};

export function StylePicker({ selected, onSelect, styles = CLIP_ART_STYLES }: StylePickerProps) {
  return (
    <div
      className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto pb-1 pl-1 pr-3 pt-0.5 [-webkit-overflow-scrolling:touch] no-scrollbar snap-x snap-mandatory sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:pb-0 sm:pl-0 sm:pr-0 sm:pt-0 sm:snap-none"
      aria-label="Art style"
    >
      {styles.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected === key}
          onClick={() => onSelect(key)}
          className={`min-h-[40px] shrink-0 snap-start rounded-full px-3.5 py-2 text-xs font-semibold transition-all sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm ${
            selected === key
              ? "bg-brand-gradient text-white shadow-md ring-2 ring-pink-400/30 ring-offset-1 ring-offset-white"
              : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
          }`}
        >
          {styleLabels[key]}
        </button>
      ))}
    </div>
  );
}
