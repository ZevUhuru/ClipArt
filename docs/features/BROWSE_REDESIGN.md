# Browse Page Redesign + Style Expansion

> **Last updated:** 2026-04-01

## Overview

Combined initiative to (1) redesign the `/search` page into a proper Browse experience with three-tier filtering (content type, category, style), coloring page integration, (2) expand the platform from 7 to 12 illustration styles, (3) add URL search params for shareable/bookmarkable views, and (4) rename "My Clip Art" to "My Creations" with infinite scroll and content filtering.

## Problem

- The search page only surfaced clip art categories — coloring pages were invisible.
- No way to filter by illustration style (flat, cartoon, etc.).
- The style catalog was limited to 7 styles; popular styles like Chibi, Pixel Art, and Kawaii were missing.
- Navigation labels said "Search" but the default behavior was category browsing.
- Filter states were not reflected in the URL — views couldn't be shared or bookmarked.
- "My Clip Art" page was limited to 50 items with no pagination or content type filtering.
- "My Clip Art" name was too narrow for a platform expanding to coloring pages, animations, and worksheets.

## New Styles (2026-04-01)

Five new styles added to the platform (total: 12 + coloring):

| Style | Prompt Descriptor | Template | Model | Aspect |
|-------|------------------|----------|-------|--------|
| Chibi | chibi anime illustration, cute big head small body, white background, bold outlines, colorful | clipart | gemini | 1:1 |
| Pixel Art | pixel art illustration, retro 8-bit style, clean pixels, white background, no anti-aliasing | clipart | gemini | 1:1 |
| Kawaii | kawaii style illustration, super cute, pastel colors, rounded shapes, white background, happy expression | clipart | gemini | 1:1 |
| 3D Render | 3D rendered illustration, soft lighting, smooth materials, white background, clean render, no shadows on background | illustration | gemini | 1:1 |
| Doodle | hand-drawn doodle illustration, sketchy lines, playful, black ink on white background, casual style | clipart | gemini | 1:1 |

## Filter Architecture

Three-tier filter bar on the Browse page:

```
[Clip Art | Coloring Pages]          <-- Tier 1: Content type toggle
[Free] [Christmas] [Heart] ...       <-- Tier 2: Category pills (dynamic per content type)
[All Styles] [Flat] [Cartoon] ...    <-- Tier 3: Style pills (clip art only)
```

### Tier 1 — Content Type Toggle
- Segmented control: "Clip Art" (default) | "Coloring Pages"
- Switching resets category and style selections
- Coloring mode hides the style filter row (coloring pages have one style)

### Tier 2 — Category Pills
- Clip Art mode: loads from static `categories` (christmas, heart, halloween, free, etc.)
- Coloring mode: fetches from `/api/categories/coloring` (mandala, unicorn, dinosaur, etc.)

### Tier 3 — Style Pills
- Only visible in Clip Art mode
- "All Styles" default + one pill per style (all 11 clip art styles)
- Passes `style` param to API

## URL Search Parameters (2026-04-01)

All filter state syncs to URL params via `router.replace()`:

| Param | Example | Description |
|-------|---------|-------------|
| `type` | `coloring` | Content type (omitted when `clipart`, the default) |
| `category` | `flower` | Active category slug |
| `style` | `chibi` | Active style filter |
| `q` | `cute+cat` | Text search query |

Example URLs:
- `/search` — all recent clip art (default)
- `/search?category=flower` — flower clip art
- `/search?type=coloring` — all coloring pages
- `/search?style=chibi&category=cat` — chibi-style cat clip art
- `/search?q=birthday+cake` — search results

### SEO Considerations

The Browse page is a client-rendered app page (`"use client"`), not a primary SEO surface. Dedicated SSR category pages (`/flower`, `/christmas`, etc.) remain the ranking targets.

Safeguards in place:
- **Canonical tag**: `app/(app)/search/layout.tsx` sets `alternates.canonical` to `/search`, telling crawlers all parameterized variants are the same page.
- **`router.replace()`**: Filter changes don't create new browser history entries, reducing crawl surface.
- **Cross-links to SEO pages**: Category filters include "Browse all {category} clip art" links pointing to the SSR category page, funneling authority to the right URLs.

Impact: Neutral to slightly positive. URL params are purely a user experience improvement (shareable, bookmarkable, back-button friendly). The canonical tag prevents index bloat or duplicate content signals.

## API Changes

### `GET /api/search`

Query parameters:

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search query |
| `category` | string | Filter by category slug |
| `style` | string | Filter by exact style (e.g. `flat`, `chibi`) |
| `content_type` | `clipart` \| `coloring` | Defaults to `clipart`; segments content |
| `browse` | `1` | Allow unfiltered browsing (no q/category/style required) |
| `limit` | number | Page size (max 60) |
| `offset` | number | Pagination offset |

When `content_type=clipart`, the query adds `.neq("style", "coloring")` to exclude coloring pages.
When `content_type=coloring`, the query adds `.eq("style", "coloring")`.

### `GET /api/categories/coloring`

Returns coloring theme categories from the database (`categories` table where `type = 'coloring'`).

## My Creations Page (2026-04-01)

### Rename
- "My Clip Art" renamed to "My Creations" across sidebar, bottom nav, and page heading.
- Future-proof for animations, worksheets, and other content types.

### Infinite Scroll
- Replaced 50-item hard limit with paginated loading (60 per page).
- `IntersectionObserver` with 400px root margin, same pattern as Browse.

### Content Type Filter
- Segmented control: All | Clip Art | Coloring Pages
- "All" shows everything (default)
- "Clip Art" filters to `.neq("style", "coloring")`
- "Coloring Pages" filters to `.eq("style", "coloring")`
- Contextual empty states per filter

## Files Modified

| File | Change |
|------|--------|
| `src/lib/styles.ts` | Add 5 new style entries to `STYLES`, `STYLE_MODEL_MAP`, `STYLE_ASPECT_MAP`, `STYLE_TEMPLATE_MAP` |
| `src/components/StylePicker.tsx` | Add 5 new style labels and keys to `CLIP_ART_STYLES` |
| `src/components/ImageCard.tsx` | Add 5 new style labels to `STYLE_LABELS` |
| `app/api/search/route.ts` | Add `style`, `content_type`, and `browse` params |
| `app/api/categories/coloring/route.ts` | New endpoint for coloring theme categories |
| `app/(app)/search/page.tsx` | Full redesign: 3-tier filters, URL params, Suspense boundary, default browse |
| `app/(app)/search/layout.tsx` | New: metadata with canonical tag for SEO |
| `app/(app)/my-art/page.tsx` | Rewritten: infinite scroll, content filter, renamed to My Creations |
| `src/components/AppSidebar.tsx` | Rename "Search" to "Browse", "My Clip Art" to "My Creations" |
| `src/components/AppBottomNav.tsx` | Rename "Search" to "Browse", "My Clip Art" to "My Creations" |
