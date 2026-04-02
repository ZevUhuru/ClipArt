# Image Card Redesign

**Date:** 2026-04-02
**Status:** Shipped

## Overview

Redesign `ImageCard` from a two-section layout (image area + metadata footer) to a compact, edge-to-edge visual thumbnail with a hover-only title overlay. The card's sole job is to be a clickable visual preview — all metadata (title, style, download) lives in the `ImageDetailDrawer` one click away.

## Previous Design

The original `ImageCard` had two distinct sections:

```
┌──────────────────────────┐
│  ┌────────────────────┐  │  <- p-2 pb-0 wrapper
│  │                    │  │
│  │   Image / Video    │  │  <- p-3 inner padding
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  Title text (truncated)  │  <- px-3.5 pb-3 pt-2.5 footer
│  [Style badge]  [DL icon]│
└──────────────────────────┘
```

### Problems with this layout

1. **Title barely readable** — at `text-[13px]` truncated to 1 line inside a ~200px card, only ~20 characters were visible. Not enough to inform a decision.
2. **Style badge redundant** — "Pixel Art" or "Cartoon" is visually obvious from the image itself. The badge confirmed what eyes already know.
3. **Download button unusable** — `h-3.5 w-3.5` (14px) icon inside a 24px hit target, hidden at `opacity-0` until hover. Practically invisible on mobile, barely discoverable on desktop.
4. **Wasted vertical space** — the metadata footer consumed ~40px per card that could show more image. On a 5-column grid of 50 cards, that is 2000px of screen real estate dedicated to near-invisible metadata.
5. **Redundant with drawer** — the `ImageDetailDrawer` already shows the full prompt, style, download button, edit link, and animate link in a properly sized, accessible layout.

### Props removed

- `showDownload` (boolean, default `true`) — no longer needed since the download button is gone from cards entirely.
- `showStyleBadge` (boolean, default `true`) — no longer needed since the style badge is gone from cards entirely.
- `STYLE_LABELS` mapping — unused after badge removal.
- `DownloadIcon` component — unused after button removal.

Call sites that passed `showStyleBadge={false}` were updated to remove the prop:
- `app/page.tsx` (homepage clip art + coloring grids)
- `app/coloring-pages/page.tsx`
- `app/stickers/page.tsx`
- `src/components/ColoringThemePage.tsx`
- `src/components/CategoryPage.tsx`

## New Design

```
┌──────────────────────────┐
│                          │
│                          │
│     Image / Video        │  <- edge-to-edge, no padding
│     (object-contain)     │
│                          │
│                          │
│  ▓▓▓▓▓▓ Title ▓▓▓▓▓▓▓▓  │  <- hover-only gradient overlay
└──────────────────────────┘
```

### Card structure

- Single `div` with `overflow-hidden rounded-2xl` and the appropriate aspect ratio class
- Image or video fills the entire card via `absolute inset-0` positioning
- A gradient overlay (`from-black/50 to-transparent`) appears on hover at the bottom, showing the title in white text
- The video badge for animated cards remains (already absolute-positioned)
- Skeleton simplified to a single aspect-ratio box (no footer bars)

### What stays the same

- `ImageCardImage` interface (unchanged)
- `variant` prop for clipart vs coloring detection
- `href` / `onClick` rendering logic (Link vs div)
- `animationPreviewUrl` with IntersectionObserver video autoplay
- `sizes` and `className` passthrough props
- Coloring page landscape detection (`md:col-span-2`)
- Outer card hover effects (`-translate-y-0.5`, `shadow-xl`)
- Focus-visible ring for accessibility

## Affected Pages

Every page using `ImageCard` gets the compact look automatically:

| Page | Grid |
|------|------|
| `/create` | Recents + Community |
| `/my-art` | My Creations |
| `/search` | Browse |
| `/` (homepage) | Clip art showcase + Coloring showcase |
| `/[category]` | Category pages |
| `/coloring-pages` | Coloring index |
| `/stickers` | Stickers index |

The `ImageDetailDrawer` and `ImageDetailPage` are separate components and are unaffected.

## Design Rationale

For a clip art / illustration library, the images are the product. Users browse visually — they scan thumbnails and click what catches their eye. Card metadata is friction, not utility. The drawer provides a full-featured inspection view where title, prompt, style, download, edit, and animate all have proper sizing and layout.

This follows the pattern used by Craiyon, Unsplash, and Pinterest where grid cards are pure visual thumbnails and detail is revealed on interaction.
