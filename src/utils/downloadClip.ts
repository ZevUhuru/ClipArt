interface DownloadOptions {
  pdf?: boolean;
  title?: string;
}

export function downloadClip(imageUrl: string, filename?: string, options?: DownloadOptions) {
  const isPdf = options?.pdf ?? false;
  const ext = isPdf ? ".pdf" : ".png";
  const fallbackName = `clip-art-${Date.now()}${ext}`;
  const name = filename || fallbackName;

  let href = `/api/download?url=${encodeURIComponent(imageUrl)}`;
  if (isPdf) {
    href += "&pdf=1";
    if (options?.title) href += `&title=${encodeURIComponent(options.title)}`;
  }

  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
