# BUG-009: Illustration Breadcrumbs Showing Clip Art Paths in JSON-LD

**Status**: Resolved
**Severity**: Medium (structured data validation errors in Google Search Console)
**Affected Pages**: All illustration detail pages (`/illustrations/[category]/[slug]`)
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. Google Search Console reported invalid `BreadcrumbList` structured data on illustration pages
2. JSON-LD breadcrumbs pointed to clip art paths (e.g., `https://clip.art/fantasy/dragon`) instead of illustration paths (`https://clip.art/illustrations/fantasy/dragon`)
3. Breadcrumb trail was missing the "Illustrations" root level

## Root Cause

The `ImageDetailPage` component hardcoded JSON-LD breadcrumbs with only two branches — clip art (default) and coloring pages. When illustrations were added, no third branch was created:

```typescript
// Only handled these two cases:
isColoringPage
  ? [Home → Coloring Pages → Theme → Image]
  : [Home → Category Clip Art → Image]  // ← illustrations fell into this
```

Illustrations incorrectly got clip art-style breadcrumbs with paths like `https://clip.art/${categorySlug}` instead of `https://clip.art/illustrations/${categorySlug}`.

## Fix

Replaced the hardcoded breadcrumb JSON-LD with `buildDetailBreadcrumb()` from `src/lib/seo-jsonld.ts`. This function accepts a `contentType` parameter and generates the correct path structure for each type:

```typescript
buildDetailBreadcrumb({
  contentType: variant as ContentType,  // "clipart" | "coloring" | "illustration"
  categorySlug,
  categoryName,
  imageTitle: image.title,
  imageSlug: image.slug,
})
```

For illustrations, this produces: `Home → Illustrations → {Category} Illustrations → {Image Title}`

## Files Changed

| File | Change |
|------|--------|
| `src/lib/seo-jsonld.ts` | New file — `buildDetailBreadcrumb()` with content-type-aware paths |
| `src/components/ImageDetailPage.tsx` | Replaced hardcoded JSON-LD with `buildDetailBreadcrumb()` |

## Lessons

1. **Structured data must stay in sync with visible breadcrumbs** — the UI breadcrumb already showed the correct path, but the JSON-LD didn't match.
2. **New content types need a checklist** — adding illustrations required touching JSON-LD, not just routes and metadata. A centralized builder prevents this class of bug.
