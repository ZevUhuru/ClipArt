# Browse Page Redesign + Style Expansion

## Overview

Combined initiative to (1) redesign the `/search` page into a proper Browse experience with three-tier filtering (content type, category, style), coloring page integration, and (2) expand the platform from 7 to 12 illustration styles.

## Problem

- The current search page only surfaces clip art categories — coloring pages are invisible.
- There is no way to filter by illustration style (flat, cartoon, etc.).
- The style catalog is limited to 7 styles; popular styles like Chibi, Pixel Art, and Kawaii are missing.
- Navigation labels say "Search" but the default behavior is category browsing, not search.

## New Styles

Five new styles added to the platform:

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
- "All Styles" default + one pill per style (all 12)
- Passes `style` param to API

## API Changes

### `GET /api/search`

New query parameters:

| Param | Type | Description |
|-------|------|-------------|
| `style` | string | Filter by exact style (e.g. `flat`, `chibi`) |
| `content_type` | `clipart` \| `coloring` | Defaults to `clipart`; when `coloring`, adds `.eq("style", "coloring")` |

When `content_type=clipart`, the query adds `.neq("style", "coloring")` to exclude coloring pages from clip art results.

### `GET /api/categories/coloring`

New endpoint returning coloring theme categories from the database (`categories` table where `type = 'coloring'`).

## UI Changes

### Browse Page (`app/(app)/search/page.tsx`)
- Content type segmented control at top
- Dynamic category pills based on content type
- Style filter row (clip art only)
- `ImageCard` renders with `variant="coloring"` when content type is coloring
- Detail drawer links to correct URL pattern (`/coloring-pages/[theme]/[slug]` vs `/[category]/[slug]`)

### Navigation
- Sidebar: "Search" renamed to "Browse" (`src/components/AppSidebar.tsx`)
- Bottom nav: "Search" renamed to "Browse" (`src/components/AppBottomNav.tsx`)

### Style Picker (`src/components/StylePicker.tsx`)
- `styleLabels` expanded with 5 new entries
- `CLIP_ART_STYLES` array expanded to include all 12 non-coloring styles

## Files Modified

| File | Change |
|------|--------|
| `src/lib/styles.ts` | Add 5 new style entries to `STYLES`, `STYLE_MODEL_MAP`, `STYLE_ASPECT_MAP`, `STYLE_TEMPLATE_MAP` |
| `src/components/StylePicker.tsx` | Add 5 new style labels and keys to `CLIP_ART_STYLES` |
| `app/api/search/route.ts` | Add `style` and `content_type` query params |
| `app/api/categories/coloring/route.ts` | New endpoint for coloring theme categories |
| `app/(app)/search/page.tsx` | Full redesign with three-tier filters |
| `src/components/AppSidebar.tsx` | Rename "Search" to "Browse" |
| `src/components/AppBottomNav.tsx` | Rename "Search" to "Browse" |
