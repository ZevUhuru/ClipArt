"use client";

import { useState } from "react";
import Link from "next/link";

interface PromptCardProps {
  prompt: string;
  style?: string;
}

export function PromptCard({ prompt, style }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tryUrl = `/create?prompt=${encodeURIComponent(prompt)}${style ? `&style=${style}` : ""}`;

  return (
    <div className="my-6 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Prompt
      </p>
      <p className="font-mono text-sm leading-relaxed text-gray-800 sm:text-base">
        {prompt}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 active:scale-[0.98]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <Link
          href={tryUrl}
          className="rounded-full bg-brand-gradient px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
        >
          Try in clip.art
        </Link>
      </div>
    </div>
  );
}
