# Import Modal Redesign

## Overview

Redesigned the Import Art modal (`ImageImportModal`) from a tab-based layout to a single scrollable view with search, content type filters, and infinite scroll. Used on `/animate` and `/edit` pages.

## Problem

The previous modal had two issues:

1. **Limited content** — Community tab fetched only 50 clipart images from `/api/community` with no search, filters, or pagination.
2. **Unnecessary friction** — Tab-based design (My Creations | Community) forced users to choose before seeing any content. The primary use case (importing your own art) didn't need to compete with browsing.

## Solution

Replaced tabs with a single scrollable view following asset-picker patterns from Canva/Figma:

```
+--------------------------------------------+
|  Import Art                            [X] |
|  Choose art to work with                   |
+--------------------------------------------+
|  [  Search art...                       ]  |
+--------------------------------------------+
|  YOUR ART                    [See all ->]  |
|  [img] [img] [img] [img] [img] [img]      |
+--------------------------------------------+
|  COMMUNITY ART                             |
|  [All] [Clip Art] [Coloring] [Illustration]|
|                                            |
|  [img] [img] [img] [img]                  |
|  [img] [img] [img] [img]                  |
|  ... infinite scroll ...                   |
+--------------------------------------------+
```

### Terminology

Standardized on "art" across the modal to match the clip.art brand and `/my-art` URL:
- "Your Art" (not "My Creations" or "Your Images")
- "Community Art" (not "Community")
- "Search art..." (not "Search images...")
- "Import Art" (modal title)

## Features

### Search

- Debounced text input (300ms) at the top of the modal.
- Searches across both user's art (`/api/me/images?q=`) and community art (`/api/search?q=`) simultaneously.
- Clear button appears when query is active.

### Your Art Section

- Compact horizontal scroll strip showing the user's last 12 images.
- "See all" button expands to a full grid view.
- When searching, automatically expands to show all matching results.
- Hidden when the user is not signed in.

### Community Art Section

- Content type filter chips: All, Clip Art, Coloring, Illustrations.
- Responsive grid (3 columns mobile, 4 columns desktop).
- Infinite scroll via IntersectionObserver — loads 40 images per page.
- Shows result count ("Showing X of Y").

### Infinite Scroll

- IntersectionObserver watches a sentinel element at the bottom of the community grid.
- 200px root margin triggers pre-fetching before the user reaches the end.
- Automatically stops when all results are loaded.

## API Changes

### `/api/search` — Added `content_type=all` support

Previously, the search API defaulted to `clipart` when no `content_type` was specified. Added support for `content_type=all` which skips the content type filter entirely, returning clip art, coloring pages, and illustrations in one response.

```typescript
// Before: always fell through to clipart
if (contentType !== "all") {
  query = query.eq("content_type", "clipart");
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/ImageImportModal.tsx` | Full rewrite — tabs removed, single scrollable view with search + filters + infinite scroll |
| `app/api/search/route.ts` | Added `content_type=all` support (1-line change) |

## State Management

```
query           → raw text input
debouncedQuery  → debounced (300ms) version used for API calls
contentType     → "all" | "clipart" | "coloring" | "illustration"
expandMine      → whether "Your Art" section is in grid vs horizontal strip
myImages        → user's fetched images
communityImages → community fetched images (appended on scroll)
communityOffset → pagination offset for infinite scroll
hasMore         → whether more community results exist
```

## Design Decisions

1. **No tabs** — User's art is always visible at the top (the 80% use case), community is always below. No upfront decision required.
2. **Horizontal strip for "Your Art"** — Compact by default so community art is visible above the fold. Expands on demand.
3. **"All" as default content type** — Users see the full catalog first, then can narrow down.
4. **Shared search** — One search bar filters both sections simultaneously, reducing cognitive overhead.
