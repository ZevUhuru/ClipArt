# Fix: Coloring Page Detail Links Returning 404

**Date:** 2026-03-25
**Severity:** Medium — coloring page detail pages unreachable from the image drawer
**Commit:** `b9c7195`

## Problem

Clicking "View full page" on any coloring page in the image drawer produced a 404 Not Found error. The issue affected all coloring pages viewed from `/create/coloring-pages` (Recents and Community tabs).

## Root Cause

Two routing systems exist for image detail pages:

- **Clip art:** `/{category}/{slug}` — queries with `.neq("style", "coloring")` to exclude coloring pages
- **Coloring pages:** `/coloring-pages/{theme}/{slug}` — queries with `.eq("style", "coloring")`

The `ImageDetailDrawer` component always built the "View full page" URL as `/{category}/{slug}`, regardless of image style. When a coloring page (e.g., `style: "coloring"`, `category: "free"`) was opened in the drawer, the link resolved to `/free/{slug}`. The clip art detail route at `app/[category]/[slug]/page.tsx` explicitly filters out coloring pages with `.neq("style", "coloring")`, so the query returned no results and the page rendered a 404.

The `.neq("style", "coloring")` filter was intentionally added earlier to prevent duplicate content between clip art and coloring page SEO routes.

## Fix

Updated `ImageDetailDrawer.tsx` to check `image.style === "coloring"` and route accordingly:

- **View full page:** `/coloring-pages/{category}/{slug}` for coloring pages, `/{category}/{slug}` for clip art
- **Category tag link:** `/coloring-pages/{category}` for coloring pages, `/{category}` for clip art
- **Generate Similar:** `/create/coloring-pages` for coloring pages, `/create` for clip art

## Files Changed

- `src/components/ImageDetailDrawer.tsx` — style-aware URL construction for detail link, category tag, and generate similar button

## Additional Context

Some older coloring pages in the database have `category: "free"` instead of the expected `"coloring-free"`. These were created before the coloring-specific classifier logic was finalized. The classifier now correctly falls back to `"coloring-free"` for coloring pages that don't match any theme, but the existing records remain. The drawer fix handles these correctly regardless of category value.
