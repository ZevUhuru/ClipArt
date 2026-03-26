# Image Lightbox Magnifier

**Date:** 2026-03-25
**Status:** Shipped
**Commit:** `8646933`

## Overview

A full-screen lightbox that lets users inspect image details at full resolution before downloading. Accessible from the image detail drawer on `/create` and `/create/coloring-pages`.

## Behavior

- Hovering the image thumbnail in the drawer reveals a subtle "View larger" pill with a magnifier icon
- Clicking the thumbnail opens a full-screen lightbox overlay (`z-[100]`) above everything including the drawer
- The image renders at its native resolution via a standard `<img>` tag, constrained to 90% of the viewport in both dimensions
- Close via: **Esc key**, clicking the **X button** (top-right), or clicking the **dark backdrop**

## UX Details

- Dark backdrop (`bg-black/90`) with `backdrop-blur-sm` for focus
- Image animates in with a spring scale transition (Framer Motion)
- "Press Esc or click outside to close" hint at the bottom of the lightbox
- Thumbnail hover state: light overlay + floating pill (opacity transition)
- Image is not draggable to avoid accidental drag interactions

## Why

Coloring pages and detailed clip art need close inspection before download — users want to verify line quality, detail accuracy, and composition. The drawer thumbnail is too small (420px on desktop, smaller on mobile) for this. The lightbox gives users confidence in what they're downloading without leaving the create flow.

## Files

- `src/components/ImageDetailDrawer.tsx` — `ImageLightbox` component, `MagnifyIcon`, updated `DrawerContent` with clickable thumbnail and lightbox state
