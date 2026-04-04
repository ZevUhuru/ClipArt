# Illustrations Content Type

**Status:** Shipped April 2026

## Background: The Problem

clip.art launched with two content types: **clip art** (isolated objects on white backgrounds) and **coloring pages** (printable line art). Both were stored in a single `generations` table with a `style` column that served double duty — it encoded both the visual aesthetic (flat, watercolor, cartoon) and the output format (coloring pages used `style = 'coloring'`).

This worked when clip art was the only "real" content type and coloring was a special case. But it created a fundamental problem: the `style` column conflated two independent dimensions.

When we decided to expand into **illustrations** (full scenes with backgrounds, environments, and lighting), the overloaded style column couldn't scale. Consider "watercolor" — it should be available as a clip art style (watercolor flower on white background) *and* as an illustration style (watercolor landscape scene). Under the old model, we'd need separate styles like `watercolor-clipart` and `watercolor-illustration`, creating combinatorial explosion as both dimensions grew.

## The Decision: Two-Axis Content Model

We evaluated three approaches:

### Option A: "With Background" Toggle
Add a boolean `has_background` flag to each style. A "watercolor" generation with `has_background = false` produces clip art; with `has_background = true`, an illustration.

**Rejected because:** Too simplistic. Illustrations aren't just "clip art with a background." They need different prompt engineering (scene composition, lighting, environment), different default aspect ratios (4:3 landscape vs 1:1 square), different categories, different SEO pages, and different classification logic. A boolean doesn't capture this.

### Option B: Duplicate Styles Per Variant
Create separate styles for each combination: `flat-clipart`, `flat-illustration`, `watercolor-clipart`, `watercolor-illustration`, etc.

**Rejected because:** Combinatorial explosion. With 11 clip art styles and 16 illustration styles (7 shared), we'd need ~27 style entries. Adding a fourth content type would multiply again. The style picker UI becomes unwieldy, and the data model treats a compound concept as atomic.

### Option C: Two Independent Axes (Chosen)
Separate the content system into two orthogonal dimensions:

- **Content Type** (`content_type` column): The output format — `clipart`, `illustration`, or `coloring`
- **Style** (`style` column): The visual aesthetic — `flat`, `watercolor`, `storybook`, etc.

Each content type defines a **template** (what kind of image to produce), and each style defines a **descriptor** (how it should look). Prompt construction combines both:

```
${userPrompt}. Style: ${descriptor}, ${template}
```

**Why this won:** Each axis scales independently. Adding a new content type (e.g., `icon`, `pattern`) requires one template and a validity mapping — no changes to existing styles. Adding a new style requires one descriptor and declaring which content types it supports. The data model is normalized, queries are clean, and the UI maps naturally (content type = which creator page, style = which pill you pick).

## The "No Text" Decision

The original prompt templates included `no text, no letters, no words` to prevent AI models from generating garbled text. During the planning phase, we challenged this constraint with a concrete use case: an educational clip art image of "a dinosaur in a bed with the word BED at the top of the bed frame."

Modern image generation models (Gemini, GPT Image 1) handle text rendering significantly better than earlier models. By removing the blanket "no text" restriction, we allow users to request text when they want it (educational materials, labeled diagrams, story illustrations with dialogue) while the model still defaults to no text when none is requested. The constraint was removed from all three content type templates.

## Naming: Why "Illustrations"

We considered three terms for the new content type:

| Term | Pros | Cons |
|------|------|------|
| **Scenes** | Descriptive of the "background + environment" aspect | Too narrow — not all illustrations are scenes (e.g., character portraits) |
| **Images** | Most generic, highest search volume | Too broad — everything is an image. Dilutes brand and confuses with clip art |
| **Illustrations** | Industry standard, clear differentiation from clip art, strong SEO value, good branding | Slightly narrower than "images" for search |

**"Illustrations" was chosen** because it communicates exactly what the product is — professionally composed artwork with backgrounds and environments — and positions us correctly in the market alongside "clip art" and "coloring pages" as distinct, well-understood content categories.

## Architecture

### Content Type Templates

Each content type has a template that defines the output format:

| Content Type | Template | Default Aspect |
|-------------|----------|----------------|
| `clipart` | clip art, isolated object on plain white background | 1:1 |
| `illustration` | illustration, full scene with detailed background, environment, and lighting | 4:3 |
| `coloring` | coloring book page, printable line art, thick clean outlines, no fills, no color, white background | 3:4 |

### Style Inventory (20 styles)

Styles are visual aesthetics that can be applied across content types. Each style has a descriptor and a validity mapping:

**Shared** (clipart + illustration, 7 styles):
`flat`, `cartoon`, `watercolor`, `vintage`, `3d`, `doodle`, `kawaii`

**Clipart exclusive** (4 styles):
`outline`, `sticker`, `chibi`, `pixel`

**Illustration exclusive** (9 styles — emphasis on storytelling and children's content):
- `storybook` — warm painterly style, soft lighting, picture book feel
- `digital-art` — clean modern style, professional rendering
- `fantasy` — dramatic lighting, epic atmosphere
- `anime` — vibrant, expressive, dynamic composition
- `collage` — mixed media, torn paper textures, layered materials
- `gouache` — flat opaque colors, matte finish, mid-century picture book feel
- `paper-art` — layered papercut, dimensional, shadow depth
- `chalk-pastel` — soft dreamy textures, gentle blending
- `retro` — mid-century modern, geometric shapes, limited palette

**Coloring** (1 style):
`coloring` — thick clean outlines, large enclosed areas

The illustration-exclusive styles were chosen with children's storytelling and publishing in mind — these are the dominant visual languages in picture books, educational content, and animated media.

### Style Validation

`VALID_STYLES` maps each content type to its allowed styles. `isValidStyleForContentType(style, contentType)` enforces this at the API level, preventing invalid combinations like `pixel` illustration or `storybook` clip art.

### Prompt Construction

```typescript
function buildPrompt(userPrompt: string, style: StyleKey, contentType: ContentType): string {
  const descriptor = STYLE_DESCRIPTORS[style];    // "watercolor painting, soft edges..."
  const template = CONTENT_TYPE_TEMPLATES[ct];      // "illustration, full scene with..."
  return `${userPrompt}. Style: ${descriptor}, ${template}`;
}
```

Example: "cozy cottage in snow" + `watercolor` + `illustration` produces:
> cozy cottage in snow. Style: watercolor painting, soft edges, paint splashes, delicate brushstrokes, vibrant tones, illustration, full scene with detailed background, environment, and lighting

Same prompt + `watercolor` + `clipart` produces:
> cozy cottage in snow. Style: watercolor painting, soft edges, paint splashes, delicate brushstrokes, vibrant tones, clip art, isolated object on plain white background

## Database Migration

The migration (`db/add-illustrations.sql`) is designed for zero-downtime deployment:

1. **Add column**: `ALTER TABLE generations ADD COLUMN content_type text NOT NULL DEFAULT 'clipart'` — existing rows automatically get `clipart`, which is correct for all non-coloring data
2. **Backfill**: `UPDATE generations SET content_type = 'coloring' WHERE style = 'coloring'` — reclassifies existing coloring pages
3. **Indexes**: Adds `idx_generations_content_type` and a partial composite index on `(content_type, is_public) WHERE is_public = true` for efficient gallery/SEO queries
4. **Seed categories**: Inserts 10 illustration categories with `type = 'illustration'`

All existing queries that previously used `style = 'coloring'` or `neq('style', 'coloring')` were migrated to use `content_type` for filtering. This is more semantically correct and future-proof — adding new styles never breaks content type filtering.

## Affected Surfaces

### Query Migration (style-based → content_type-based)

Every data-fetching surface was updated from filtering by `style` to filtering by `content_type`:

| Surface | Before | After |
|---------|--------|-------|
| Clip art SEO pages | `.neq("style", "coloring")` | `.eq("content_type", "clipart")` |
| Coloring SEO pages | `.eq("style", "coloring")` | `.eq("content_type", "coloring")` |
| Search API | `style !== "coloring"` exclusion | `.eq("content_type", contentType)` |
| My Art page | `filter === "coloring"` on style | `filter` maps to `content_type` column |
| Homepage galleries | `.neq("style", "coloring")` | `.eq("content_type", "clipart")` |

### New Routes

| Route | Purpose |
|-------|---------|
| `/create/illustrations` | Illustration creator (16 styles, aspect ratio picker, queue-based generation) |
| `/illustrations` | SEO hub with category grid and featured gallery |
| `/illustrations/[category]` | Category page (e.g., `/illustrations/fantasy-scenes`) |
| `/illustrations/[category]/[slug]` | Detail page with download, metadata, JSON-LD |
| `/api/categories/illustration` | List illustration categories |

### UI Updates

- **CreateModeToggle**: Three tabs — Clip Art, Illustrations, Coloring Pages
- **StylePicker**: Now accepts a `styles` prop to show content-type-appropriate options
- **ImageDetailDrawer**: Routes "View" link correctly based on `content_type`
- **Search page**: Added "Illustrations" tab, dynamically loads styles per content type
- **My Art page**: Added "Illustrations" filter tab
- **Sitemap**: Includes illustration hub, categories, and detail pages

### Admin Panel

- **Categories**: Type selector, type column with badges, type filter, correct view links
- **Images**: Type column, content-type-aware "View public page" links, R2 key prefixes
- **Models**: Shows all styles across all content types with scope badges
- **API revalidation**: All admin CRUD operations revalidate the correct content-type path

### Generation Queue

All three creators (clip art, illustrations, coloring pages) now share the same non-blocking `useGenerationQueue` pattern:
- Prompt clears immediately on submit
- Jobs run in parallel in the background
- `GenerationQueue` component shows progress cards with animated progress bars
- The queue store accepts optional `contentType` and `aspectRatio` parameters

## Pricing

1 credit = 1 illustration (same as clip art and coloring pages). The strategic play is that illustrations serve as the primary input for the animation pipeline, where per-second video credits create higher engagement and revenue.

## Key Files

| File | Role |
|------|------|
| `src/lib/styles.ts` | Two-axis content model: `STYLE_DESCRIPTORS`, `CONTENT_TYPE_TEMPLATES`, `VALID_STYLES`, `buildPrompt()` |
| `src/lib/imageGen.ts` | Image generation with content type routing and aspect ratio defaults |
| `src/lib/classify.ts` | Three-branch classification (clipart/illustration/coloring) with per-type system prompts |
| `src/lib/categories.ts` | Category helpers: `getIllustrationCategories()`, `getIllustrationCategoryBySlug()` |
| `src/stores/useGenerationQueue.ts` | Non-blocking generation queue with `contentType`/`aspectRatio` support |
| `app/api/generate/route.ts` | Generation API: validates style×contentType, routes R2 prefix, revalidates per type |
| `app/(app)/create/illustrations/page.tsx` | Illustration creation UI with queue-based generation |
| `app/illustrations/` | SEO page tree (hub, category, detail) |
| `src/components/IllustrationCategoryPage.tsx` | Reusable category page component |
| `db/add-illustrations.sql` | Migration: column, backfill, indexes, category seeds |

## Migration Checklist

1. Run `db/add-illustrations.sql` against Supabase
2. Deploy code (all changes are backward-compatible with the default `clipart` value)
3. Verify `/create/illustrations` loads with style picker
4. Verify `/illustrations` SEO hub shows categories
5. Verify `/admin/categories` shows illustration categories with purple badges
6. Verify `/admin/models` lists all styles
