export function downloadClip(imageUrl: string, filename?: string) {
  const fallbackName = `clip-art-${Date.now()}.png`;
  const name = filename || fallbackName;

  const a = document.createElement("a");
  a.href = `/api/download?url=${encodeURIComponent(imageUrl)}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
