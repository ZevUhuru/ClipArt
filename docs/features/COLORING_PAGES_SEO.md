# Phase 2: Coloring Pages SEO Landing Pages

## Opportunity

"Coloring pages" has **448K monthly search volume** vs "clip art" at 52K -- nearly 9x larger. The long-tail is massive:

| Theme | Target Keyword | Monthly SV |
|-------|---------------|:----------:|
| unicorn | unicorn coloring pages | 56K |
| mandala | mandala coloring pages | 77K |
| dinosaur | dinosaur coloring pages | 45K |
| animals | animals coloring pages | 40K |
| princess | princess coloring pages | 32K |
| christmas | christmas coloring pages | 35K |
| easter | easter coloring pages | 28K |
| spring | spring coloring pages | 27K |
| mermaid | mermaid coloring pages | 19K |
| ocean | ocean coloring pages | 18K |
| space | space coloring pages | 15K |
| farm | farm coloring pages | 12K |

Note: "Mandala" refers to geometric/spiritual circular patterns used in Hindu and Buddhist art. Not a brand. Extremely popular with adults for relaxation/mindfulness coloring.

## Architecture

```
clip.art/
  coloring-pages/                    ← Landing page (448K SV root keyword)
  coloring-pages/dinosaur/           ← Theme hub (45K SV)
  coloring-pages/dinosaur/happy-dino-abc123  ← Detail page (long-tail)
```

All three levels are SEO-optimized server-rendered pages with ISR (60s revalidation), full metadata, Open Graph tags, Twitter cards, JSON-LD structured data, and sitemap inclusion.

### Data Flow

```
User generates on /create/coloring-pages
  → POST /api/generate (style="coloring")
    → classifyPrompt detects style="coloring"
      → loads coloring theme slugs from DB (type='coloring')
      → classifies into theme (e.g. "dinosaur")
    → R2 upload: coloring-pages/{theme}/{slug}.webp
    → generations table: category="dinosaur", style="coloring"
    → revalidatePath("/coloring-pages/dinosaur")

SEO pages query: generations WHERE style='coloring' AND category={theme} AND is_public=true
```

## Database Changes

### `categories` table: add `type` column

```sql
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'clipart';
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);
```

Existing clip art categories automatically get `type = 'clipart'`. New coloring themes are inserted with `type = 'coloring'`.

### Coloring themes seed data

12 themes seeded with full SEO metadata (h1, meta_title, meta_description, intro, seo_content paragraphs, suggested_prompts, related_slugs). Each row targets a specific high-volume keyword.

**File:** `db/add-coloring-themes.sql`

## Route Structure

### `/coloring-pages` -- Landing Page

**File:** `app/coloring-pages/page.tsx`

Static route (takes priority over `[category]` dynamic route).

SEO elements:
- `<title>`: "Free Coloring Pages -- AI Coloring Page Generator | clip.art"
- `<meta description>`: Targets "coloring pages", "free coloring pages", "AI coloring pages"
- Open Graph: type "website", canonical URL, site name
- `<h1>`: "Free AI Coloring Pages"
- Intro paragraph with target keywords naturally integrated
- Theme grid: cards linking to `/coloring-pages/{theme}` with theme names as anchor text (internal linking)
- Featured gallery: recent public coloring page generations
- CTA: "Create Your Own Coloring Page" linking to `/create/coloring-pages`
- SEO content paragraphs below the fold
- Footer with site-wide links

### `/coloring-pages/[theme]` -- Theme Pages

**File:** `app/coloring-pages/[theme]/page.tsx`

`generateStaticParams` pre-renders all active coloring themes. ISR 60s for fresh gallery content.

SEO elements:
- `<title>`: "{Theme} Coloring Pages -- Free Printable {Theme} Coloring Sheets | clip.art"
- `<meta description>`: Theme-specific, mentions "free", "printable", "AI generated"
- Open Graph + Twitter cards with theme-specific copy
- `<h1>`: From DB `categories.h1` (e.g. "Dinosaur Coloring Pages")
- Intro paragraph: From DB `categories.intro`
- Gallery: Portrait-aspect (3:4) image grid from `generations` where `style='coloring'` and `category=theme.slug`
- Suggested prompts: From DB, theme-specific (e.g. "T-Rex in a jungle", "baby dinosaur hatching from egg")
- CTA: "Create {Theme} Coloring Pages" linking to `/create/coloring-pages`
- SEO content: 2 paragraphs from DB
- Related themes: Internal links to other coloring theme pages via `related_slugs`
- Breadcrumb: Home > Coloring Pages > {Theme}

### `/coloring-pages/[theme]/[slug]` -- Detail Pages

**File:** `app/coloring-pages/[theme]/[slug]/page.tsx`

`dynamicParams = true`, no static params (all on-demand). ISR 60s.

SEO elements:
- `<title>`: "{Title} -- Free {Theme} Coloring Page | clip.art"
- `<meta description>`: Image-specific description from classifier
- Open Graph: type "article", image URL as og:image, full canonical URL
- Twitter: summary_large_image card with image
- `<h1>`: Image title
- Breadcrumb: Home > Coloring Pages > {Theme} > {Title}
- JSON-LD: ImageObject schema + BreadcrumbList schema
- Category badge linking back to theme page
- Download CTA: "Download Free Coloring Page"
- Generate similar CTA linking to `/create/coloring-pages`
- Related coloring pages grid
- License info (free for personal/commercial use)

## Classifier Changes

**File:** `src/lib/classify.ts`

When `style === "coloring"`:
- `getCategorySlugs()` is replaced with `getColoringThemeSlugs()` which queries `categories WHERE type='coloring' AND is_active=true`
- System prompt changes from "clip art classifier" to "coloring page classifier"
- Fallback category: "coloring-free" (catch-all theme for unclassifiable prompts)
- Title/description generation adapted for coloring context

When style is anything else (existing behavior):
- Uses clip art category slugs (now filtered to `type='clipart'`)
- No changes to existing flow

## R2 Storage

Coloring page images stored under a distinct prefix to avoid collision with clip art:

```
Clip art:      {category}/{slug}.webp       → free/happy-sun-abc123.webp
Coloring:      coloring-pages/{theme}/{slug}.webp → coloring-pages/dinosaur/trex-jungle-xyz789.webp
```

## Sitemap Updates

**File:** `app/sitemap.ts`

Three new sections added:
1. `/coloring-pages` -- priority 0.95, daily (high-value landing page)
2. `/coloring-pages/{theme}` for each active theme -- priority 0.9, daily
3. `/coloring-pages/{theme}/{slug}` for public coloring generations -- priority 0.7, weekly

## Cross-Linking Strategy

Internal linking is critical for passing authority from high-traffic coloring pages to the rest of the site:

```
Google → /coloring-pages (landing)
           ↓ theme grid cards
         /coloring-pages/dinosaur (theme)
           ↓ image card click
         /coloring-pages/dinosaur/trex-jungle (detail)
           ↓ "Create Your Own" CTA
         /create/coloring-pages (generator)
           ↓ sidebar nav
         /create (clip art generator)
```

Cross-links added:
- Homepage (`/`): "Try our AI Coloring Pages" link to `/coloring-pages`
- Coloring landing: theme grid + CTA to generator
- Theme pages: related themes (horizontal links), CTA to generator, breadcrumb to landing
- Detail pages: breadcrumb chain, category badge to theme, CTA to generator
- Generator (`/create/coloring-pages`): "Browse Coloring Pages" link to `/coloring-pages`

## Component Inventory

| Component | File | Purpose |
|-----------|------|---------|
| `ColoringThemePage` | `src/components/ColoringThemePage.tsx` | Theme page UI (gallery, CTAs, SEO content) |
| `ImageDetailPage` | `src/components/ImageDetailPage.tsx` | Reused for detail pages (already handles aspect_ratio) |
| `CategoryNav` | `src/components/CategoryNav.tsx` | Marketing header (shared with clip art SEO pages) |

## Data Access

**File:** `src/lib/categories.ts`

New helpers:
- `getColoringThemes()` -- all active categories where `type = 'coloring'`
- `getColoringThemeBySlug(slug)` -- single theme by slug where `type = 'coloring'`
- `getColoringThemeSlugs()` -- slug array for classifier

Existing helpers updated:
- `getAllCategories()` -- adds filter `type = 'clipart'` (or omits type filter for backward compat, since all existing rows default to 'clipart')

## File Map

```
New files:
  db/add-coloring-themes.sql                         Migration + theme seed data
  app/coloring-pages/page.tsx                        Landing page
  app/coloring-pages/[theme]/page.tsx                Theme pages
  app/coloring-pages/[theme]/[slug]/page.tsx         Detail pages
  src/components/ColoringThemePage.tsx                Theme page component

Modified files:
  src/lib/categories.ts                              Coloring theme helpers
  src/lib/classify.ts                                Style-aware classification
  app/api/generate/route.ts                          Coloring R2 paths + revalidation
  app/sitemap.ts                                     Coloring pages in sitemap
  app/page.tsx                                       Cross-link to coloring pages
  app/(app)/create/coloring-pages/page.tsx           Cross-link to browse
  db/migration.sql                                   Type column for fresh deploys
```
