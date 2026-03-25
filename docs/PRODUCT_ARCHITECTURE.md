# Product Architecture

## Overview

clip.art's product is organized into three top-level **tools** and two **browse** sections. Each tool maps to a sidebar item and a dedicated route. Sub-features within a tool are accessed via an in-page segmented control (mode toggle), not additional sidebar items.

## Sidebar Structure

```
TOOLS
  Create        /create           (active)
  Animate       /animate          (coming soon)
  Edit          /edit             (coming soon)

BROWSE
  Search        /search
  My Clip Art   /my-art
```

## Tools

### Create

Generate AI images from text prompts. Sub-modes selected via an inline segmented control at the top of the generator bar:

| Mode | Route | Description |
|------|-------|-------------|
| **Clip Art** | `/create` | Default. 6 style options (Flat, Outline, Cartoon, Sticker, Vintage, Watercolor). Square 1:1 output. |
| **Coloring Pages** | `/create/coloring-pages` | Locked to `coloring` style. Portrait 3:4 output. Optimized for printable line art with bold outlines. |

Each mode has its own Next.js route for clean URLs and SEO. The `CreateModeToggle` component uses `Link`-based navigation so switching modes is instant (no full page reload).

**Target users:** Teachers (worksheets, classroom materials), POD sellers (product designs), content creators (blog/social media assets).

### Animate (Coming Soon)

Convert static clip art into short animations. Likely powered by video generation models (e.g. Kling). Top-level tool because animation is a fundamentally different output type (video vs. image).

### Edit (Coming Soon)

Post-processing toolkit for images. Sub-modes selected via the same segmented control pattern as Create:

| Mode | Route | Description |
|------|-------|-------------|
| **Remove BG** | `/edit/remove-bg` | Strip backgrounds for transparent PNGs. Critical for POD sellers and teachers making worksheets. Highest-priority sub-mode. |
| **Upscale** | `/edit/upscale` | 2x-4x resolution increase for print-ready output. Essential for coloring pages (letter/A4 print) and POD products (4500px+). |
| **Vectorize** | `/edit/vectorize` | Convert raster to SVG. Best for flat/outline/sticker styles that are naturally vector-like. Future addition. |

## Design Principles

### Three-tool sidebar

The sidebar shows *what* the user can do (Create, Animate, Edit). Sub-modes within each tool show *how* they can do it. This keeps the sidebar clean and scales as features grow — new sub-modes don't add sidebar clutter.

### Route-based sub-modes

Each sub-mode gets its own route (e.g. `/create/coloring-pages`, `/edit/remove-bg`) rather than storing mode in client state. Benefits:
- Clean, shareable URLs
- SEO-friendly (each mode can have its own meta tags)
- Browser back/forward works naturally
- No state loss on refresh

### Shared toggle component

The `CreateModeToggle` component (`src/components/CreateModeToggle.tsx`) is the pattern for all sub-mode selectors. When Edit launches, it will get an equivalent `EditModeToggle` using the same design language.

Toggle design:
- Pill-shaped container with `rounded-xl border border-gray-200 bg-gray-100 p-1`
- Active segment: `bg-white text-gray-900 shadow-sm`
- Inactive segment: `text-gray-400 hover:text-gray-600`
- `text-sm font-semibold` for proper visual weight

### "Coming Soon" treatment

Unreleased tools appear in the sidebar as non-interactive items with a "Soon" pill badge:
- Dimmed text (`text-gray-600`) and `cursor-default`
- Subtle badge: `bg-white/[0.06]` with `text-[10px] font-bold uppercase`
- Rendered as `<div>` instead of `<Link>` to prevent navigation to non-existent routes

## Target Audiences

| Audience | Primary tools | Key needs |
|----------|--------------|-----------|
| **Teachers** | Create (coloring pages, clip art), Edit (remove BG, upscale) | Printable worksheets, bulletin board art, classroom decorations |
| **POD sellers** | Create (clip art), Edit (remove BG, upscale, vectorize) | High-res transparent PNGs, SVGs for products |
| **Content creators** | Create (clip art), Animate | Social media assets, blog illustrations, presentations |

## File Map

```
src/components/
  AppSidebar.tsx          Sidebar with Tools + Browse sections
  AppBottomNav.tsx        Mobile bottom nav (active tools only)
  CreateModeToggle.tsx    Segmented control for Create sub-modes

app/(app)/
  create/
    page.tsx              Clip Art generator (default Create mode)
    coloring-pages/
      page.tsx            Coloring Pages generator
  animate/                (future)
  edit/                   (future)
    remove-bg/            (future)
    upscale/              (future)
    vectorize/            (future)
```
