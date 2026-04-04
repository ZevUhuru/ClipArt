# BUG-011: VideoObject Structured Data Missing Required Fields

**Status**: Resolved
**Severity**: Medium (Google Search Console validation errors on learn articles)
**Affected Pages**: All learn article pages (`/learn/[slug]`)
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. Google Search Console reported `VideoObject` structured data errors on learn articles
2. The `description` field was `undefined` when the post had no description
3. The `thumbnailUrl` field was `undefined` when no thumbnail was set
4. Google requires `name`, `description`, `thumbnailUrl`, and `uploadDate` as minimum fields for `VideoObject`

## Root Cause

The JSON-LD in `app/learn/[slug]/page.tsx` unconditionally included all fields, setting them to `undefined` when the source data was missing:

```typescript
{
  "@type": "VideoObject",
  name: meta.title,
  description: meta.description,        // could be undefined
  thumbnailUrl: meta.thumbnailUrl        // could be undefined
    ? `https://clip.art${meta.thumbnailUrl}`
    : undefined,
  duration: meta.duration
    ? `PT${meta.duration.replace(":", "M")}S`
    : undefined,
  // ...
}
```

When `JSON.stringify` serializes `undefined` values in an object, they are omitted entirely from the output. This means the JSON-LD was missing required fields instead of having empty or fallback values.

## Fix

Refactored the VideoObject construction to only include optional fields when they have values, and provide a fallback for the required `description` field:

```typescript
const videoLd: Record<string, unknown> = {
  "@type": "VideoObject",
  name: meta.title,
  description: meta.description || "A video tutorial from clip.art Learn.",
  uploadDate: meta.date,
  embedUrl: url,
};
if (meta.thumbnailUrl) {
  videoLd.thumbnailUrl = meta.thumbnailUrl.startsWith("http")
    ? meta.thumbnailUrl
    : `https://clip.art${meta.thumbnailUrl}`;
}
if (meta.duration) {
  const parts = meta.duration.split(":");
  if (parts.length === 2) videoLd.duration = `PT${parts[0]}M${parts[1]}S`;
}
if (meta.muxPlaybackId) {
  videoLd.contentUrl = `https://stream.mux.com/${meta.muxPlaybackId}.m3u8`;
}
```

Required fields (`name`, `description`, `uploadDate`, `embedUrl`) are always present. Optional fields (`thumbnailUrl`, `duration`, `contentUrl`) are only added when available.

## Files Changed

| File | Change |
|------|--------|
| `app/learn/[slug]/page.tsx` | Refactored VideoObject JSON-LD to guard optional fields and provide description fallback |

## Lessons

1. **`undefined` in JSON.stringify produces omitted keys, not empty strings** — this silently breaks structured data validation.
2. **Required fields need guaranteed values** — use fallback strings for required schema.org properties.
3. **Optional fields should be conditionally included** — don't set them to `undefined`; omit the key entirely via conditional logic.
