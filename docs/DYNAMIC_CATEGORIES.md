# Dynamic Categories

Categories are stored in the Supabase `categories` table, replacing the original hardcoded `src/data/categories.ts`. This supports scaling to 100+ categories without code deploys.

## Database Schema

```sql
categories (
  id            uuid PRIMARY KEY,
  slug          text UNIQUE NOT NULL,    -- URL path: clip.art/{slug}
  name          text NOT NULL,           -- Display name: "Christmas"
  h1            text NOT NULL,           -- Page heading: "Christmas Clip Art"
  meta_title    text,                    -- SEO title tag
  meta_description text,                 -- SEO meta description
  intro         text,                    -- Intro paragraph below h1
  seo_content   text[],                  -- Array of SEO paragraphs
  suggested_prompts text[],              -- Array of 3 example prompts
  related_slugs text[],                  -- Array of related category slugs
  image_count   integer DEFAULT 0,       -- Denormalized count (future use)
  is_active     boolean DEFAULT true,    -- Controls visibility
  sort_order    integer DEFAULT 0,       -- Display ordering
  created_at    timestamptz DEFAULT now()
)
```

## How Category Pages Work

### `app/[category]/page.tsx`

- Server component with `revalidate = 60` (ISR)
- `generateStaticParams()` queries `getAllCategories()` from DB
- `generateMetadata()` pulls `meta_title` and `meta_description` from the DB row
- Fetches gallery images from `generations` table where `category = slug` and `is_public = true`
- Fetches related categories by their slugs from the DB
- Passes everything to the `CategoryPage` client component

### Dynamic Params

`dynamicParams = true` (default) allows categories created after build to render on-demand. The first request triggers an ISR build, subsequent requests serve cached until the 60s revalidation window.

### Cache Busting

When a new image is generated, the generate route calls `revalidatePath('/{category}')` to bust the Vercel edge cache for that category page immediately.

## R2 Storage Convention

Each category maps to a virtual folder in R2:

```
images.clip.art/{category-slug}/{image-slug}-{uid}.png
```

R2 doesn't require folder pre-creation. The path is created automatically on first image upload. When an image is re-categorized in the admin CMS, the R2 object is moved (copy + delete) to the new category path.

## Adding a New Category

### Via Admin CMS (preferred)

1. Go to `clip.art/admin/categories`
2. Click "New Category"
3. Enter name and slug
4. Toggle "Auto-generate SEO fields with AI" (recommended)
5. Save

The category page goes live immediately at `clip.art/{slug}`. Images classified into it (or re-categorized to it) will appear on that page.

### Via SQL (direct)

```sql
INSERT INTO categories (slug, name, h1, meta_title, meta_description, intro, is_active, sort_order)
VALUES ('birthday', 'Birthday', 'Birthday Clip Art', 
        'Birthday Clip Art — Free AI Generated Birthday Images',
        'Browse and generate birthday clip art...', 
        'Cakes, balloons, party hats...', true, 11);
```

## Legacy Compatibility

The original `src/data/categories.ts` still exists and is used by:

- `getCategoryImages()` — returns static sample images for a category slug
- `getCategorySlugForImage()` — maps internal image category names to URL slugs
- `sampleGallery.ts` — the 29 static sample images

These sample images will continue to appear on category pages alongside DB-sourced images. As the gallery grows with generated content, the sample images become less prominent.

## Sitemap

`app/sitemap.ts` pulls all active categories from the DB and all public generations to build a complete sitemap. Revalidates hourly (`revalidate = 3600`).

## Migrations

| File | What it does |
|------|--------------|
| `db/add-admin-cms.sql` | Creates the `categories` table, seeds 10 initial categories, adds `is_admin` to profiles, adds `slug`/`description` to generations |
| `db/add-public-gallery.sql` | Adds `search_vector`, `category`, `is_public`, `title` to generations. GIN index for FTS |
| `db/migration.sql` | Original schema: `profiles`, `generations`, `purchases` |
