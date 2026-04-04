# Illustrations Content Type

**Status:** Shipped April 2026

## Overview

Illustrations are the third content type on clip.art, alongside clip art and coloring pages. Unlike clip art (isolated subjects on white backgrounds), illustrations are complete compositions with detailed backgrounds, environments, and lighting.

## Architecture: Two-Axis Content Model

The content system uses two independent axes:

- **Content Type** (output format): `clipart | illustration | coloring`
- **Style** (visual aesthetic): `flat`, `watercolor`, `storybook`, `fantasy`, etc.

Prompt construction combines both: `${userPrompt}. Style: ${descriptor}, ${template}`

### Content Type Templates

| Content Type | Template |
|-------------|----------|
| clipart | clip art, isolated object on plain white background |
| illustration | illustration, full scene with detailed background, environment, and lighting |
| coloring | coloring book page, printable line art, thick clean outlines, no fills, no color, white background |

### Style Inventory

**Shared styles** (available for both clipart and illustration): flat, cartoon, watercolor, vintage, 3d, doodle, kawaii

**Clipart exclusive**: outline, sticker, chibi, pixel

**Illustration exclusive** (9 styles): storybook, digital-art, fantasy, anime, collage, gouache, paper-art, chalk-pastel, retro

**Coloring**: coloring (expandable in the future)

## Database

- `generations.content_type` column: `clipart` (default), `illustration`, or `coloring`
- `categories.type`: `clipart`, `illustration`, or `coloring`
- 10 illustration categories seeded via `db/add-illustrations.sql`
- Existing clip art data unaffected (default value is `clipart`)
- Coloring rows backfilled with `content_type = 'coloring'`

## Routes

### App (creation)

- `/create` — Clip art (default)
- `/create/illustrations` — Illustration creator with 16 style options
- `/create/coloring-pages` — Coloring pages

### SEO pages

- `/illustrations` — Hub page with category grid and featured gallery
- `/illustrations/[category]` — Category page (e.g., `/illustrations/fantasy-scenes`)
- `/illustrations/[category]/[slug]` — Detail page with download, metadata, JSON-LD

### API

- `POST /api/generate` accepts `contentType` parameter
- `GET /api/categories/illustration` — list illustration categories
- `GET /api/search?content_type=illustration` — search illustrations
- `GET /api/me/images?filter=illustrations` — user's illustrations

## Admin Panel

All `/admin` pages are updated to handle the new content type:

### Categories (`/admin/categories`)

- **Type selector** on create/edit form — set category as Clip Art, Illustration, or Coloring
- **Type column** with color-coded badges (purple = illustration, blue = coloring, gray = clip art)
- **Type filter** tabs to narrow the list by content type
- **View links** route correctly to `/illustrations/{slug}`, `/coloring-pages/{slug}`, or `/{slug}`

### Images (`/admin/images`)

- **Type column** shows content type badge for each generation
- **Image edit page** displays content type in metadata footer
- **"View public page" link** routes to the correct URL based on content type
- **Category reassignment** uses content-type-aware R2 key prefixes when moving files
- **Revalidation** targets the correct path tree on edits and deletes

### Models (`/admin/models`)

- Lists all styles across all content types (was previously hardcoded to 6 clip art styles)
- Shows badge per style indicating scope: clipart, illustration, shared, or coloring

### API fixes

- `POST /api/admin/categories` revalidates the correct path based on category type
- `DELETE /api/admin/categories/[id]` fetches `type` before deleting for correct revalidation
- `PATCH /api/admin/images/[id]` uses content-type-aware R2 prefixes (`illustrations/`, `coloring-pages/`, or root)
- `DELETE /api/admin/images/[id]` revalidates the correct content-type-specific path

## Pricing

1 credit = 1 illustration (same as clip art). The strategic value is funneling illustrations into the animation pipeline where per-second credits apply.

## Key Files

| File | Role |
|------|------|
| `src/lib/styles.ts` | Two-axis content model, style descriptors, templates, valid combinations |
| `src/lib/imageGen.ts` | Image generation with content type routing |
| `src/lib/classify.ts` | Three-branch classification (clipart/illustration/coloring) |
| `src/lib/categories.ts` | Illustration category helpers |
| `app/api/generate/route.ts` | Generation API with content type support |
| `app/(app)/create/illustrations/page.tsx` | Illustration creation UI |
| `app/illustrations/` | SEO page tree |
| `src/components/IllustrationCategoryPage.tsx` | Category page component |
| `db/add-illustrations.sql` | Migration: content_type column + illustration categories |
| `app/admin/categories/page.tsx` | Admin categories with type filter, selector, and correct view links |
| `app/admin/images/page.tsx` | Admin images list with content type column |
| `app/admin/images/[id]/page.tsx` | Admin image edit with content-type-aware links |
| `app/admin/models/page.tsx` | Model config showing all styles across content types |
| `app/api/admin/images/[id]/route.ts` | Content-type-aware R2 paths and revalidation |

## Migration

Run `db/add-illustrations.sql` against the Supabase database to:
1. Add `content_type` column to `generations`
2. Backfill existing coloring rows
3. Create indexes
4. Seed illustration categories
