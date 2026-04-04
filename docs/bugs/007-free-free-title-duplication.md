# BUG-007: "Free Free Clip Art" Title Duplication

**Status**: Resolved
**Severity**: Medium (SEO title quality degradation on high-traffic category)
**Affected Pages**: `/free/*` (clip art detail pages in the "Free" category)
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. Clip art detail pages under the "Free" category had titles like:
   `Cute Cat — Free Free Clip Art | clip.art`
2. The word "Free" appeared twice — once from the category name and once from the template
3. Google displayed these malformed titles in search results

## Root Cause

The title template in `generateMetadata` was:

```typescript
const title = `${imageTitle} — Free ${categoryName} Clip Art | clip.art`;
```

When `categoryName` was `"Free"` (the category), this produced `Free Free Clip Art`.

Every page independently constructed its own title string with no shared logic or guard against this edge case.

## Fix

Introduced `buildTitle()` in `src/lib/seo.ts` which detects when `categoryName` is `"Free"` and omits the redundant word:

```typescript
if (categoryName) {
  const isFreeCategory = categoryName.toLowerCase() === "free";
  middle = isFreeCategory
    ? ` — Free ${label}`
    : ` — Free ${categoryName} ${label}`;
}
```

All 6 detail page routes now use `buildPageMetadata()` which calls `buildTitle()` internally.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/seo.ts` | New file — `buildTitle()` with "Free Free" guard |
| `app/[category]/[slug]/page.tsx` | Replaced manual title with `buildPageMetadata()` |
| `app/coloring-pages/[theme]/[slug]/page.tsx` | Replaced manual title with `buildPageMetadata()` |
| `app/illustrations/[category]/[slug]/page.tsx` | Replaced manual title with `buildPageMetadata()` |

## Lessons

1. **Centralize title generation** — when multiple pages share the same title pattern, a single builder function prevents edge-case drift.
2. **Category names are user data** — they can be anything, including words that collide with template text like "Free."
