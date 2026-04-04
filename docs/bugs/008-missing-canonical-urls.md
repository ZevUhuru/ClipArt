# BUG-008: Missing Canonical URLs on Clip Art Pages

**Status**: Resolved
**Severity**: High (duplicate content risk in Google index)
**Affected Pages**: All clip art category pages (`/[category]`) and detail pages (`/[category]/[slug]`)
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. Clip art category listing pages had no `<link rel="canonical">` tag
2. Clip art detail pages had no `<link rel="canonical">` tag
3. Google could index the same content under multiple URL variations, diluting ranking signals
4. Coloring and illustration pages already had canonicals — only clip art was missing

## Root Cause

The `generateMetadata` functions in `app/[category]/page.tsx` and `app/[category]/[slug]/page.tsx` did not include `alternates.canonical` in the returned `Metadata` object. These were the oldest pages in the codebase and were written before canonical URLs became standard practice on the site.

```typescript
// Missing from the returned object:
// alternates: { canonical: `https://clip.art/${category.slug}` },
```

The root layout also had no `metadataBase` set, so relative canonical URLs wouldn't have resolved correctly anyway.

## Fix

1. Added `metadataBase: new URL("https://clip.art")` to the root layout
2. Refactored all clip art pages to use `buildPageMetadata()` and `buildListingMetadata()` from `src/lib/seo.ts`, which always include `alternates.canonical`
3. Every page now passes a `path` parameter that gets normalized into a full canonical URL via `buildCanonical()`

## Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Added `metadataBase` |
| `app/[category]/page.tsx` | Uses `buildListingMetadata()` with canonical |
| `app/[category]/[slug]/page.tsx` | Uses `buildPageMetadata()` with canonical |
| `src/lib/seo.ts` | New file — `buildCanonical()` normalizes paths to full URLs |

## Lessons

1. **Canonical URLs should be part of the metadata builder, not an afterthought** — if every page has to remember to add `alternates.canonical`, some will forget.
2. **Set `metadataBase` early** — Next.js uses it to resolve relative URLs in metadata. Without it, relative canonicals silently fail.
