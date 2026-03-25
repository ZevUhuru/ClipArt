export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const TOPIC_LABELS: Record<string, string> = {
  prompts: "Prompts",
  seasonal: "Seasonal",
  coloring: "Coloring Pages",
  teachers: "Teachers",
  pod: "Print on Demand",
  guide: "Guides",
};
