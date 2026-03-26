# Image Detail Page Redesign

**Date:** 2026-03-25
**Status:** In Progress

## Overview

Redesign `ImageDetailPage` into a first-class SEO landing page with a premium hero presentation, clear visual hierarchy, related images from the database, and conversion-optimized layout for both clip art and coloring pages.

## Problems Addressed

1. **Image presentation is plain** -- flat `bg-gray-50` box with thin border feels like a placeholder
2. **No visual separation between hero and content** -- everything runs together on white
3. **Coloring pages have no related images** -- `relatedImages` hardcoded to `[]`, wasting high-value conversion real estate
4. **No lightbox/magnify on the detail page** -- only available in the drawer, not on the indexed landing page
5. **Tags show raw slugs** instead of human-readable labels
6. **CTA section is disconnected** -- gradient CTA floats alone below empty space

## Design

### Hero Theater

- Decorative gradient frame: outer `rounded-3xl bg-brand-gradient p-[2px]`, inner white container with generous padding
- Magnify button overlaid on image (bottom-right, glass-morphism pill) opening full-screen lightbox
- "Printable" badge on coloring pages (top-left ribbon)

### Hero / Content Division

- Soft gradient divider: `h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent`
- Below-fold content on subtle `bg-gray-50/30` background

### Related Images

- Coloring pages: DB query for same theme/category, `style = "coloring"`, exclude current, limit 8
- Clip art: DB query for same category, exclude coloring style, exclude current, limit 8
- Uses existing `ImageCard` + `ImageGrid` components
- Fetched in parent server pages, passed as `relatedImages` prop

### Conversion Polish

- Download button shimmer highlight animation (CSS-only `@keyframes shimmer`)
- Trust strip with checkmark icons replacing plain license text
- Tightened gradient CTA banner

## Files Changed

- `src/components/ImageLightbox.tsx` -- new shared component extracted from drawer
- `src/components/ImageDetailPage.tsx` -- major redesign
- `src/components/ImageDetailDrawer.tsx` -- import shared lightbox
- `src/styles/globals.css` -- shimmer keyframes
- `app/coloring-pages/[theme]/[slug]/page.tsx` -- fetch related coloring pages
- `app/[category]/[slug]/page.tsx` -- fetch related clip art

## Unchanged

- CategoryNav header, MarketingFooter, JSON-LD, breadcrumb structure
