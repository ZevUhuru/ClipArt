# Bug 018: Animation Detail — Source Image Link 404

**Date**: 2026-04-05
**Status**: Fixed
**Severity**: Medium

## Symptom

On animation detail pages (`/animations/[slug]`), clicking the "Source image"
card navigated to a 404 page. Example:

- Animation page: `clip.art/animations/raccoon-basketball-star-df8d8955`
- Broken link: `clip.art/animals-scenes/raccoon-basketball-star-yjcvgj` → **404**

## Root Cause

Two issues combined:

1. **Missing `content_type` in query** — The Supabase join on the source
   generation only selected `id, title, prompt, image_url, style, category,
   slug`. Without `content_type`, there was no way to determine the correct
   URL pattern for the source image.

2. **Hardcoded URL pattern** — The link was built as `/${category}/${slug}`,
   which only matches the `app/[category]/[slug]/page.tsx` route. That route
   filters by `.eq("content_type", "clipart")`, so illustrations and coloring
   pages would always 404. The correct patterns are:
   - clipart: `/{category}/{slug}`
   - illustration: `/illustrations/{category}/{slug}`
   - coloring: `/coloring-pages/{category}/{slug}`

## Fix

- Added `content_type` to both source generation join queries in
  `app/animations/[slug]/page.tsx`.
- Updated the `AnimationRow` interface to include `content_type` on the
  `source` object.
- Replaced the single `/${category}/${slug}` href with content-type-aware
  routing that mirrors the drawer logic in `ImageDetailDrawer.tsx`.

## Files Changed

| File | Change |
|------|--------|
| `app/animations/[slug]/page.tsx` | Added `content_type` to source join, fixed href routing |
