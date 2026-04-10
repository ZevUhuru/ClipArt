"use client";

import { useState } from "react";

interface AttributionSectionProps {
  url: string;
  title: string;
}

export function AttributionSection({ url, title }: AttributionSectionProps) {
  const [tab, setTab] = useState<"html" | "text">("html");
  const [copied, setCopied] = useState(false);

  const htmlSnippet = `<a href="${url}">${title} – Free Clip Art</a>`;
  const textSnippet = `"${title}" via clip.art — ${url}`;
  const snippet = tab === "html" ? htmlSnippet : textSnippet;

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3">
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            License
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
            CC BY 4.0
          </span>
        </div>
        {/* Tab toggle */}
        <div className="flex rounded-md border border-gray-200 bg-white text-[10px] font-semibold overflow-hidden">
          <button
            onClick={() => setTab("html")}
            className={`px-2 py-1 transition-colors ${tab === "html" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            HTML
          </button>
          <button
            onClick={() => setTab("text")}
            className={`px-2 py-1 transition-colors ${tab === "text" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Text
          </button>
        </div>
      </div>

      {/* Snippet + copy */}
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md bg-white px-2.5 py-1.5 font-mono text-[10px] text-gray-600 border border-gray-200">
          {snippet}
        </code>
        <button
          onClick={handleCopy}
          title="Copy"
          className="flex-shrink-0 rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-800"
        >
          {copied ? (
            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      <p className="mt-2 text-[10px] text-gray-400">
        Free for personal &amp; commercial use. Attribution appreciated.
      </p>
    </div>
  );
}
