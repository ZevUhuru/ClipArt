# BUG-010: /coloring-pages/free Returns 404

**Status**: Resolved
**Severity**: Low (broken internal breadcrumb link, affects small subset of coloring pages)
**Affected Pages**: Coloring pages with `category: "free"`, e.g. `/coloring-pages/free/dinosaur-in-a-jungle-scene-5jqy8y`
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. A coloring page detail page (e.g., `/coloring-pages/free/dinosaur-in-a-jungle-scene-5jqy8y`) renders correctly
2. The breadcrumb includes a link to `/coloring-pages/free`
3. Clicking that breadcrumb link returns a 404 page
4. No theme with slug `"free"` exists in the categories table

## Root Cause

Some coloring pages in the database have `category: "free"` as their category value. The `ImageDetailPage` component constructs the breadcrumb category link as:

```typescript
const categoryHref = `/coloring-pages/${categorySlug}`;
```

This produces `/coloring-pages/free`. The coloring theme page at `app/coloring-pages/[theme]/page.tsx` calls `getColoringThemeBySlug("free")`, which returns `null` because no such theme exists, triggering `notFound()`.

The category value `"free"` is a generic label, not a proper theme slug. The correct fallback is the coloring pages hub (`/coloring-pages`).

## Fix

Added a guard in `ImageDetailPage` that maps `category: "free"` to the coloring pages hub instead of a non-existent theme page:

```typescript
const safeCategorySlug = variant === "coloring" && categorySlug === "free" ? "" : categorySlug;
const categoryHref = variant === "coloring"
  ? (safeCategorySlug ? `/coloring-pages/${safeCategorySlug}` : "/coloring-pages")
  : isIllustration
    ? `/illustrations/${categorySlug}`
    : `/${categorySlug}`;
```

When `categorySlug` is `"free"` on a coloring page, the breadcrumb now links to `/coloring-pages` instead of `/coloring-pages/free`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ImageDetailPage.tsx` | Added `safeCategorySlug` guard for coloring pages with `category: "free"` |

## Lessons

1. **Category values in the database aren't always valid URL slugs** — "free" is a label, not a theme. Always validate that a breadcrumb target actually exists, or provide a safe fallback.
2. **Internal link auditing catches these** — this was found during an SEO crawl that flagged 404s from internal links.
