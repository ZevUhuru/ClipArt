# BUG-006: "Download Animation" Opens Video in Browser Instead of Saving File

**Status**: Resolved
**Severity**: Medium (users cannot download animations without manual save-as)
**Affected Pages**: `/my-art` (drawer), `/animate`, `/animations`
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. User clicks "Download Animation" on any animation card or detail drawer
2. Browser navigates to the R2 CDN URL (e.g. `https://images.clip.art/animations/...mp4`)
3. Video plays in a new page instead of downloading to the file system
4. User must manually right-click > "Save As" to get the file

## Root Cause

Animation download buttons used a plain `<a>` tag with the `download` attribute:

```html
<a href="https://images.clip.art/animations/.../video.mp4"
   download="clip-art-animation.mp4">
  Download Animation
</a>
```

The `download` attribute only works for **same-origin** URLs. Since the video files are hosted on R2 CDN (`images.clip.art`), which is a different origin from the app (`clip.art`), the browser ignores the `download` attribute and navigates to the URL instead — playing the video.

Image downloads already worked correctly because they used `/api/download?url=...`, a same-origin proxy endpoint that fetches the file server-side and responds with `Content-Disposition: attachment`. Animations were not using this proxy.

## Fix

### 1. Extended `/api/download` to support video files

The download proxy previously only handled images (converting everything to PNG via `sharp`). Added video detection that streams the file through with the correct content type instead of attempting image conversion:

```typescript
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

if (VIDEO_EXTENSIONS.has(ext.toLowerCase())) {
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${basename}${ext}"`,
    },
  });
}
```

Videos are streamed directly from the upstream response body (no buffering into memory), keeping memory usage low for large files.

### 2. Changed all animation download buttons to use the proxy

Replaced direct `<a href={videoUrl}>` links with buttons that programmatically trigger a download through the proxy:

```typescript
onClick={() => {
  const a = document.createElement("a");
  a.href = `/api/download?url=${encodeURIComponent(videoUrl)}`;
  a.download = `${slug}-animation.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}}
```

This matches the existing pattern used by `downloadClip()` for image downloads.

## Files Changed

| File | Change |
|------|--------|
| `app/api/download/route.ts` | Added video extension detection and stream-through passthrough |
| `src/components/ImageDetailDrawer.tsx` | Animation download uses proxy instead of direct link |
| `app/(app)/animate/page.tsx` | "Download MP4" button uses proxy |
| `app/animations/AnimationGrid.tsx` | Grid overlay download button uses proxy |

## Lessons

1. **The `download` attribute is silently ignored cross-origin** — no error, no warning. The link just navigates. Always proxy downloads for assets on a different origin.
2. **Consistent download patterns matter** — images already had the proxy pattern (`downloadClip` → `/api/download`). Animations should have used the same approach from the start.
3. **Stream large files, don't buffer** — videos can be tens of MB. Using `upstream.body` as a pass-through stream avoids loading the entire file into memory on the server.
