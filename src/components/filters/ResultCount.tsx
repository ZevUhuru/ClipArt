"use client";

interface ResultCountProps {
  total: number | null;
  isLoading: boolean;
  contentType?: string;
  activeFilters?: string[];
}

const CONTENT_LABELS: Record<string, string> = {
  clipart: "clip art",
  illustration: "illustrations",
  coloring: "coloring pages",
  animations: "animations",
};

export function ResultCount({ total, isLoading, contentType, activeFilters = [] }: ResultCountProps) {
  if (isLoading) {
    return (
      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
    );
  }

  if (total === null) return null;

  const label = contentType ? (CONTENT_LABELS[contentType] || contentType) : "results";
  const filterContext = activeFilters.length > 0
    ? ` for "${activeFilters.join(", ")}"`
    : "";

  return (
    <p className="text-xs text-gray-400">
      <span className="font-medium text-gray-500">{total.toLocaleString()}</span>{" "}
      {label}{filterContext}
    </p>
  );
}
