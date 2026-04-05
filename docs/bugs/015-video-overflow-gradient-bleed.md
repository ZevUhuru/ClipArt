# Bug 015 — Video overflow / gradient bleed on animation detail page

**Status:** Fixed  
**Date:** 2026-04-04  
**Severity:** Visual (P2)

## Symptom

On `/animations/[slug]` detail pages, the hero video visually overflowed its
gradient border frame, with the coloured gradient background bleeding through
at the bottom of the container.

## Root Cause

Two layered issues:

1. **Browser compositor escape:** The `<video>` element with native `controls`
   renders in a GPU compositor layer that ignores CSS `overflow: hidden`. This
   is a known browser behaviour — `overflow` only clips at the CSS layout level,
   not at the compositing level where video controls are painted.

2. **Gradient background expansion:** The gradient border was implemented as
   `bg-brand-gradient` + `p-[2px]` on a wrapper div. The video's intrinsic
   dimensions caused this wrapper to grow taller than the inner container,
   exposing the gradient background below the video.

## Fix

Restructured the video frame to use absolutely positioned layers inside a
fixed-size parent:

```
┌─ relative aspect-square ──────────────┐
│  ┌─ absolute inset-0 (gradient ring) ─┤
│  │                                     │
│  │  ┌─ absolute inset-[2px] ──────────┤
│  │  │  clip-path: inset(0 round 22px) │
│  │  │  ┌─ video ─────────────────────┐│
│  │  │  │  h-full w-full object-contain││
│  │  │  └─────────────────────────────┘│
│  │  └─────────────────────────────────┤
│  └────────────────────────────────────┤
└───────────────────────────────────────┘
```

- **`aspect-square` on the outer wrapper** locks the total size so nothing can
  grow beyond it.
- **Gradient ring is `absolute inset-0`** — can't expand because it's positioned,
  not in flow.
- **Video container uses `clip-path: inset(0 round 22px)`** — hardware-enforced
  pixel clipping that the browser's video compositor cannot escape, unlike
  `overflow: hidden`.

## Files Changed

- `app/animations/[slug]/page.tsx`

## Lesson

Never rely on `overflow: hidden` to contain `<video>` elements with native
controls. Use `clip-path: inset(...)` for hard GPU-level clipping. When using
the gradient-border-via-background pattern, pin both layers with absolute
positioning inside a fixed-size parent to prevent layout expansion.
