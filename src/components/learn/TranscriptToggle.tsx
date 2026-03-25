"use client";

import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";

interface TranscriptToggleProps {
  transcript: string;
}

export function TranscriptToggle({ transcript }: TranscriptToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!transcript || !transcript.trim()) return null;

  return (
    <div className="overflow-hidden rounded-b-xl border-x border-b border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <span className="flex items-center gap-2">
          <FileText size={16} />
          {isOpen ? "Hide Transcript" : "Show Transcript"}
        </span>
        <ChevronDown
          size={16}
          className="transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <div className="max-h-80 overflow-y-auto border-t border-gray-200 px-4 py-4">
          <pre className="m-0 whitespace-pre-wrap font-mono text-sm leading-7 text-gray-600">
            {transcript}
          </pre>
        </div>
      )}
    </div>
  );
}
