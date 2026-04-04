# Product Architecture

## Overview

clip.art's product is organized into three top-level **tools** and two **browse** sections. Each tool maps to a sidebar item and a dedicated route. Sub-features within a tool are accessed via an in-page segmented control (mode toggle), not additional sidebar items.

## Content Model: Two-Axis System

All generated images are classified along two independent axes:

- **Content Type** (`content_type` column): The output format — `clipart`, `illustration`, or `coloring`
- **Style** (`style` column): The visual aesthetic — `flat`, `watercolor`, `storybook`, `fantasy`, etc.

This separation means styles can be reused across content types (e.g., "watercolor clip art" vs. "watercolor illustration") without combinatorial explosion. See `docs/features/ILLUSTRATIONS.md` for the full architectural decision record.

Prompt construction combines both axes:
```
${userPrompt}. Style: ${STYLE_DESCRIPTORS[style]}, ${CONTENT_TYPE_TEMPLATES[contentType]}
```

Core implementation: `src/lib/styles.ts`

## Sidebar Structure

```
TOOLS
  Create        /create           (active)
  Animate       /animate          (active)
  Edit          /edit             (coming soon)

BROWSE
  Search        /search
  My Art        /my-art
```

## Tools

### Create

Generate AI images from text prompts. Sub-modes selected via an inline segmented control (`CreateModeToggle`) at the top of the generator bar:

| Mode | Route | Description |
|------|-------|-------------|
| **Clip Art** | `/create` | Default. 11 style options. Square 1:1 output. Isolated objects on white backgrounds. |
| **Illustrations** | `/create/illustrations` | 16 style options (7 shared + 9 exclusive). Landscape 4:3 default. Full scenes with backgrounds and environments. |
| **Coloring Pages** | `/create/coloring-pages` | Locked to `coloring` style. Portrait 3:4 output. Printable line art with bold outlines. |

All three modes use the shared `useGenerationQueue` store for non-blocking parallel generation. The prompt clears immediately on submit, jobs run in the background, and progress is shown via `GenerationQueue` cards.

**Target users:** Teachers (worksheets, classroom materials), POD sellers (product designs), content creators (blog/social media assets), children's publishers (storybook illustrations).

### Animate

Convert static clip art and illustrations into short video animations. Powered by Kling video generation models. Features a generation queue, animation suggestions, and admin curation (featured grid, hero mosaic).

| Route | Description |
|-------|-------------|
| `/animate` | Animation creator with source image selection and motion prompts |

See `docs/features/ANIMATION.md` for full documentation.

### Edit (Coming Soon)

Post-processing toolkit for images. Sub-modes selected via the same segmented control pattern as Create:

| Mode | Route | Description |
|------|-------|-------------|
| **Remove BG** | `/edit/remove-bg` | Strip backgrounds for transparent PNGs. Critical for POD sellers and teachers making worksheets. Highest-priority sub-mode. |
| **Upscale** | `/edit/upscale` | 2x-4x resolution increase for print-ready output. Essential for coloring pages (letter/A4 print) and POD products (4500px+). |
| **Vectorize** | `/edit/vectorize` | Convert raster to SVG. Best for flat/outline/sticker styles that are naturally vector-like. |

## SEO Page Structure

Each content type has its own parallel SEO route tree:

```
Clip Art:        /[category]/[slug]
Illustrations:   /illustrations/[category]/[slug]
Coloring Pages:  /coloring-pages/[theme]/[slug]
```

Each tree includes a hub page, category/theme listing pages, and individual detail pages with JSON-LD, Open Graph metadata, and ISR (60s revalidation).

## Design Principles

### Three-tool sidebar

The sidebar shows *what* the user can do (Create, Animate, Edit). Sub-modes within each tool show *how* they can do it. This keeps the sidebar clean and scales as features grow — new sub-modes don't add sidebar clutter.

### Route-based sub-modes

Each sub-mode gets its own route (e.g. `/create/coloring-pages`, `/create/illustrations`) rather than storing mode in client state. Benefits:
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

### Non-blocking generation

All creators use the `useGenerationQueue` Zustand store instead of blocking `await fetch()`. This allows users to queue multiple generations, see progress in real-time, and keep working while images generate in the background.

### "Coming Soon" treatment

Unreleased tools appear in the sidebar as non-interactive items with a "Soon" pill badge:
- Dimmed text (`text-gray-600`) and `cursor-default`
- Subtle badge: `bg-white/[0.06]` with `text-[10px] font-bold uppercase`
- Rendered as `<div>` instead of `<Link>` to prevent navigation to non-existent routes

## Target Audiences

| Audience | Primary tools | Key needs |
|----------|--------------|-----------|
| **Teachers** | Create (all modes), Edit (remove BG, upscale) | Printable worksheets, bulletin board art, classroom decorations, educational illustrations |
| **POD sellers** | Create (clip art), Edit (remove BG, upscale, vectorize) | High-res transparent PNGs, SVGs for products |
| **Content creators** | Create (clip art, illustrations), Animate | Social media assets, blog illustrations, presentations |
| **Children's publishers** | Create (illustrations), Animate | Storybook art, character illustrations, animated story content |

## File Map

```
src/lib/
  styles.ts                 Two-axis content model (types, styles, templates, validation)
  imageGen.ts               AI image generation with content type routing
  classify.ts               Three-branch prompt classification
  categories.ts             Category helpers for all content types

src/stores/
  useGenerationQueue.ts     Non-blocking generation queue (contentType, aspectRatio support)
  useAppStore.ts            Global app state (user, credits, generations)

src/components/
  AppSidebar.tsx            Sidebar with Tools + Browse sections
  AppBottomNav.tsx          Mobile bottom nav (active tools only)
  CreateModeToggle.tsx      Segmented control for Create sub-modes (3 tabs)
  GenerationQueue.tsx       Queue progress cards with animated progress bars
  StylePicker.tsx           Dynamic style pills (accepts content-type-specific styles)

app/(app)/
  create/
    page.tsx                Clip Art generator (default Create mode)
    illustrations/
      page.tsx              Illustrations generator
    coloring-pages/
      page.tsx              Coloring Pages generator
  animate/
    page.tsx                Animation creator
  edit/                     (future)

app/
  [category]/               Clip art SEO pages
  illustrations/            Illustration SEO pages
  coloring-pages/           Coloring page SEO pages

app/admin/
  categories/page.tsx       Category CMS with type filter/selector
  images/page.tsx           Image management with content type column
  models/page.tsx           Model config for all styles across content types
  animations/page.tsx       Animation curation (featured, mosaic)
```
