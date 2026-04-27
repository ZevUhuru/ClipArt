"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type StyleKey } from "@/lib/styles";

type Difficulty = "starter" | "intermediate" | "advanced";

interface PromptEntry {
  prompt: string;
  style: StyleKey;
  category: string;
  difficulty: Difficulty;
}

const PROMPTS: PromptEntry[] = [
  // Animals — starter → advanced
  {
    prompt: "A fox kit curled in a pile of autumn leaves, wide curious eyes",
    style: "flat", category: "Animals", difficulty: "starter",
  },
  {
    prompt: "An owl in silent flight, wings fully spread against a full moon, soft feather detail",
    style: "watercolor", category: "Animals", difficulty: "intermediate",
  },
  {
    prompt: "A hummingbird hovering over a hibiscus, iridescent wings mid-beat, symmetrical composition",
    style: "flat", category: "Animals", difficulty: "intermediate",
  },
  {
    prompt: "A polar bear cub peering over a snow ridge, blue-white palette, minimal background",
    style: "cartoon", category: "Animals", difficulty: "starter",
  },
  {
    prompt: "A geometric low-poly wolf portrait, triangular facets, bold symmetry, limited cool palette",
    style: "flat", category: "Animals", difficulty: "advanced",
  },

  // Fantasy / Mystical
  {
    prompt: "A sugar skull adorned with marigolds and geometric ornament, Day of the Dead, bold flat fills, pink and teal",
    style: "flat", category: "Fantasy", difficulty: "advanced",
  },
  {
    prompt: "A celestial moth with moon phases on its wings, symmetrical, botanical illustration detail",
    style: "watercolor", category: "Fantasy", difficulty: "intermediate",
  },
  {
    prompt: "A tiny dragon perched on a stack of spell books, candlelight glow, warm palette",
    style: "cartoon", category: "Fantasy", difficulty: "starter",
  },
  {
    prompt: "A vintage apothecary bottle with a miniature sailing ship inside, fine crosshatch linework, sepia",
    style: "flat", category: "Fantasy", difficulty: "advanced",
  },

  // Botanical / Nature
  {
    prompt: "An art nouveau wildflower wreath — lavender, daisy, baby's breath — fine linework, circular composition",
    style: "watercolor", category: "Nature", difficulty: "advanced",
  },
  {
    prompt: "A carnivorous pitcher plant with intricate vein detail, scientific botanical illustration style",
    style: "flat", category: "Nature", difficulty: "advanced",
  },
  {
    prompt: "Cherry blossom branch in Japanese woodblock style, bold curved lines, limited pale pink palette",
    style: "flat", category: "Nature", difficulty: "intermediate",
  },
  {
    prompt: "A single mushroom cottage nestled in moss with tiny glowing windows",
    style: "cartoon", category: "Nature", difficulty: "starter",
  },

  // Food
  {
    prompt: "A steaming ramen bowl with perfectly arranged toppings, bird's eye view, geometric flat style",
    style: "flat", category: "Food", difficulty: "intermediate",
  },
  {
    prompt: "A tiered afternoon tea stand with macarons and petit fours, pastel palette, elegant linework",
    style: "watercolor", category: "Food", difficulty: "intermediate",
  },
  {
    prompt: "A smiling avocado toast with sesame seeds and chili flakes, kawaii faces, clean outlines",
    style: "cartoon", category: "Food", difficulty: "starter",
  },

  // Retro / Vintage
  {
    prompt: "A vintage travel badge for an imaginary mountain lodge, 3-color screen print, circular composition, bold type",
    style: "flat", category: "Retro", difficulty: "advanced",
  },
  {
    prompt: "A 1950s diner at night with neon signs reflecting on rain-wet asphalt, warm halftone palette",
    style: "flat", category: "Retro", difficulty: "advanced",
  },
  {
    prompt: "A retro rocket patch design, embroidered badge feel, mid-century space age palette, bold outlines",
    style: "flat", category: "Retro", difficulty: "intermediate",
  },

  // People / Characters
  {
    prompt: "A 1920s jazz musician mid-performance, art deco geometric style, gold and black palette",
    style: "flat", category: "People", difficulty: "advanced",
  },
  {
    prompt: "A samurai in full armor viewed from the front, geometric low-poly facets, bold symmetrical composition",
    style: "flat", category: "People", difficulty: "advanced",
  },
  {
    prompt: "A child in an oversized raincoat jumping over a puddle, warm cartoon style",
    style: "cartoon", category: "People", difficulty: "starter",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(PROMPTS.map((p) => p.category)))];

const STYLE_THEME: Record<string, { badge: string; badgeBg: string }> = {
  flat:       { badge: "text-pink-600",   badgeBg: "bg-pink-50" },
  cartoon:    { badge: "text-amber-600",  badgeBg: "bg-amber-50" },
  watercolor: { badge: "text-violet-600", badgeBg: "bg-violet-50" },
  sketch:     { badge: "text-slate-600",  badgeBg: "bg-slate-50" },
  "3d":       { badge: "text-cyan-600",   badgeBg: "bg-cyan-50" },
};

const DIFFICULTY_LABEL: Record<Difficulty, { label: string; color: string }> = {
  starter:      { label: "Starter",      color: "text-emerald-500" },
  intermediate: { label: "Intermediate", color: "text-amber-500" },
  advanced:     { label: "Advanced",     color: "text-rose-500" },
};

function styleTheme(style: string) {
  return STYLE_THEME[style] ?? { badge: "text-gray-500", badgeBg: "bg-gray-50" };
}

interface PromptLibraryProps {
  onSelect: (prompt: string, style: StyleKey) => void;
}

export function PromptLibrary({ onSelect }: PromptLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(
    () => (activeCategory === "All" ? PROMPTS : PROMPTS.filter((p) => p.category === activeCategory)),
    [activeCategory],
  );

  return (
    <div className="py-4">
      {/* Section divider */}
      <div className="flex items-center gap-3 pb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <span className="text-[11px] font-medium tracking-wide text-gray-400">Prompt Ideas</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((entry, i) => {
            const theme = styleTheme(entry.style);
            const diff = DIFFICULTY_LABEL[entry.difficulty];

            return (
              <motion.button
                key={`${entry.category}-${i}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.025, ease: "easeOut" }}
                onClick={() => onSelect(entry.prompt, entry.style)}
                className="group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-gray-100 bg-white text-left transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80"
              >
                {/* Top meta */}
                <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    {entry.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${diff.color}`}>
                      {diff.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${theme.badge} ${theme.badgeBg}`}>
                      {entry.style}
                    </span>
                  </div>
                </div>

                {/* Prompt text */}
                <p className="flex-1 px-4 pb-3 text-[13px] font-medium leading-snug text-gray-700 group-hover:text-gray-900">
                  {entry.prompt}
                </p>

                {/* Divider + action */}
                <div className="flex items-center justify-between border-t border-gray-100/80 px-4 py-2.5">
                  <span className="text-[11px] font-medium text-gray-300 transition-colors group-hover:text-pink-500">
                    Use this prompt
                  </span>
                  <svg
                    className="h-3.5 w-3.5 text-gray-200 transition-all group-hover:translate-x-0.5 group-hover:text-pink-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
