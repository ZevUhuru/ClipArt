# Bug 017 — Drawer routes all images to clipart detail page (404 for illustrations/coloring)

**Status:** Fixed  
**Date:** 2026-04-04  
**Severity:** Broken links (P1)

## Symptom

Clicking "View full page" or "Share" from the image drawer for
illustrations, coloring pages, or any non-clipart image led to a 404.

Example: an illustration with slug `frog-life-cycle-diagram-xy2tgd`
was routed to `/free/frog-life-cycle-diagram-xy2tgd` (the clipart
detail page), which queries with `content_type = 'clipart'` and
returns nothing.

The correct URL should have been
`/illustrations/free/frog-life-cycle-diagram-xy2tgd`.

## Root Cause

The drawer determines the detail page URL based on content type:

```typescript
const isColoring = contentType === "coloring" || image.style === "coloring";
const isIllustration = contentType === "illustration";

const detailHref = isAnimation
  ? `/animations/${image.slug}`
  : isColoring
    ? `/coloring-pages/${image.category}/${image.slug}`
    : isIllustration
      ? `/illustrations/${image.category}/${image.slug}`
      : `/${categorySlug}/${image.slug}`;  // ← clipart fallback
```

But `contentType` was read from `image.content_type` which was never
populated. The `DrawerImage` interface didn't have `content_type`, the
`/api/me/images` API didn't select it, and no caller passed it through.

Result: `isIllustration` was always `false`, `isColoring` only worked
when `style === "coloring"`, and everything else fell through to the
clipart route.

## Fix

Threaded `content_type` through the entire data pipeline:

1. **API** — Added `content_type` to the `/api/me/images` SELECT
2. **Store** — Added `content_type` to `DrawerImage` interface
3. **Drawer** — Reads `image.content_type` directly (already had the
   logic, just never received the data)
4. **All callers** — Updated every place that builds drawer items:
   - `/my-art` page (drawerList, inline img, ImageCard)
   - `/create` page (toDrawerImage)
   - `/create/illustrations` page (drawerList)
   - `/create/coloring-pages` page (drawerList)
   - `/search` page (SearchResult interface + content_type injection)
   - `HistoryGrid` component
5. **ImageCard** — Added `content_type` to `ImageCardImage` interface

## Files Changed

- `app/api/me/images/route.ts`
- `src/stores/useImageDrawer.ts`
- `src/components/ImageDetailDrawer.tsx`
- `src/components/ImageCard.tsx`
- `src/components/HistoryGrid.tsx`
- `app/(app)/my-art/page.tsx`
- `app/(app)/create/page.tsx`
- `app/(app)/create/illustrations/page.tsx`
- `app/(app)/create/coloring-pages/page.tsx`
- `app/(app)/search/page.tsx`

## Lesson

When a UI component branches on a data field, that field must be
present at every point in the pipeline — API response, store interface,
and every caller that constructs the data object. A missing field
silently evaluates to `undefined`, making all branches fall through to
the default case with no error.
