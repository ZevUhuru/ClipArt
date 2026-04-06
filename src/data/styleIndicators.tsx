import type { StyleKey } from "@/lib/styles";

export const STYLE_COLORS: Record<StyleKey, string> = {
  flat: "bg-gradient-to-br from-pink-400 to-rose-500",
  outline: "bg-white border-2 border-gray-800",
  cartoon: "bg-gradient-to-br from-yellow-400 to-orange-500",
  sticker: "bg-gradient-to-br from-violet-400 to-purple-500",
  vintage: "bg-gradient-to-br from-amber-600 to-yellow-800",
  watercolor: "bg-gradient-to-br from-sky-300 to-blue-400 opacity-80",
  chibi: "bg-gradient-to-br from-pink-300 to-fuchsia-400",
  pixel: "bg-[conic-gradient(#4ade80_25%,#22c55e_25%_50%,#4ade80_50%_75%,#22c55e_75%)]",
  kawaii: "bg-gradient-to-br from-pink-200 to-pink-400",
  "3d": "bg-gradient-to-br from-slate-300 to-slate-500",
  doodle: "bg-white border border-gray-400 border-dashed",
  coloring: "bg-white border-2 border-gray-300",
  storybook: "bg-gradient-to-br from-amber-300 to-orange-400",
  "digital-art": "bg-gradient-to-br from-cyan-400 to-blue-500",
  fantasy: "bg-gradient-to-br from-purple-500 to-indigo-600",
  anime: "bg-gradient-to-br from-rose-400 to-pink-500",
  collage: "bg-gradient-to-br from-teal-300 via-amber-200 to-rose-300",
  gouache: "bg-gradient-to-br from-orange-300 to-red-400",
  "paper-art": "bg-gradient-to-br from-stone-200 to-stone-400",
  "chalk-pastel": "bg-gradient-to-br from-violet-200 to-rose-200",
  retro: "bg-gradient-to-br from-orange-500 to-red-600",
};

export function StyleIndicator({ styleKey }: { styleKey: StyleKey }) {
  const colorClass = STYLE_COLORS[styleKey] || "bg-gray-300";
  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${colorClass}`}
      aria-hidden
    />
  );
}
