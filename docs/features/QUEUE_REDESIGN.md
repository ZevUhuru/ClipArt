# Queue Redesign: Horizontal Thumbnails & Film Strip

**Date:** April 8, 2026

## Overview

Redesigned both the Generation Queue (image creation) and Animation Queue (video creation) from vertical stacking bars to compact horizontal layouts. The Generation Queue uses thumbnail cubes; the Animation Queue uses a classic film strip — a deliberate design choice that reinforces clip.art's creative/artistic identity.

## Why This Matters to Our Brand

clip.art is a creative tool for artists and designers. Every UI surface is an opportunity to reinforce that identity. The **film strip** animation queue is a standout example:

- It evokes **classic cinema and animation** — a direct nod to the creative act of turning still images into motion
- The dark celluloid background, sprocket perforations, and frame-by-frame layout feel like a **physical artifact** in a digital tool, giving the animation process a sense of craft and tactility
- The sprocket holes **animate when jobs are processing**, creating a visual metaphor of film threading through a projector — the user's art is literally being brought to life
- When processing completes, the sprocket animation stops — a satisfying, intentional pause that signals "your film is ready"
- This kind of thematic detail elevates clip.art from a utility to an **experience**, which is core to our brand differentiation

## Generation Queue (Image Creation)

**File:** `src/components/GenerationQueue.tsx`

### Layout
- 80px square cards in a single horizontal scrollable row (hidden scrollbar)
- Header row: title + active count + "Clear done" button

### Card States
- **Generating:** Circular SVG progress ring with pink-to-orange gradient, percentage text, on gray background
- **Completed:** Thumbnail fills the card. Click opens the `ImageDetailDrawer` with `isOwner: true` and prev/next navigation across all completed queue items
- **Failed:** Red-tinted card with error icon, dismiss on hover

### Click-to-Preview
Completed items open the existing `ImageDetailDrawer` via `useImageDrawer` store. The full list of completed queue images is passed, enabling arrow-key and button navigation between results without leaving the create page.

### Session Persistence
The queue store uses Zustand's `persist` middleware with `sessionStorage`. Completed items survive page refreshes within the same tab. In-progress jobs are dropped on refresh (the server-side generation completes and results appear in My Art).

## Animation Queue (Film Strip)

**File:** `src/components/AnimationQueue.tsx`

### Visual Design
- Dark `bg-gray-900` rounded container with inner shadow (the "celluloid")
- Sprocket perforations along top and bottom edges — small rounded rectangles repeating horizontally
- Film frames: 88x72px rectangular cards with 1.5px gap, rounded-sm corners, dark borders

### Sprocket Animation
When any job is processing, the sprocket holes scroll horizontally via CSS `@keyframes filmScroll` — simulating film threading through a projector gate. Animation stops when all jobs complete.

### Frame States
- **Processing:** Source image dimmed to 50% brightness with desaturation. Projector-gate flicker overlay (`@keyframes flicker`). Mini progress bar (pink-to-orange gradient, amber when stale). Elapsed time counter. Duration and audio badges.
- **Completed:** Full brightness source image. Play triangle icon on hover. Clickable to view result. Emerald glow border on hover.
- **Failed:** Source image desaturated to grayscale at 35% brightness. Red overlay with X icon. "Retry" button on hover.
- **Stale (>10 min):** Amber "Slow" badge. Amber progress bar color. Retry available on hover.

### Hover Actions
All actions appear only on hover to keep frames clean:
- **Active:** Cancel X (top-right)
- **Completed:** Dismiss X (top-right), play icon (center)
- **Failed/Stale:** Dismiss X (top-right), Retry button (bottom-center)

## Prompt Builder Divider

**File:** `src/components/prompt-builder/PromptBuilder.tsx`

A subtle inline section divider between the queue and prompt builder regions. Thin gradient lines fade from transparent on both edges, with "Prompt Builder" centered between them alongside a sparkle icon in brand pink. Takes ~20px vertical space.

## Files Changed

| File | Change |
|------|--------|
| `src/components/GenerationQueue.tsx` | Full rewrite: horizontal thumbnail strip with click-to-preview |
| `src/components/AnimationQueue.tsx` | Full rewrite: film strip with sprocket animation |
| `src/stores/useGenerationQueue.ts` | Added Zustand persist middleware with sessionStorage |
| `src/stores/useImageDrawer.ts` | No changes (reused existing drawer infrastructure) |
| `src/components/prompt-builder/PromptBuilder.tsx` | Added section divider at top |
