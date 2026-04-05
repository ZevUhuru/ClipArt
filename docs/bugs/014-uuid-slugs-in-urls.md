# BUG-014: Old Generations Display UUIDs Instead of Readable Slugs in URLs

**Status**: Resolved
**Severity**: Medium (poor SEO for affected pages, ugly URLs for users)
**Affected Pages**: All clip art, coloring page, and illustration detail pages for records created before slug generation was added
**Date Reported**: April 4, 2026
**Date Fixed**: April 4, 2026

## Symptoms

1. Some public image detail pages had URLs like `/free/d9d09503-458e-46f4-afba-96b403c4db2e` instead of `/free/boy-ice-skating-in-snow-a3f2k1`
2. The page content rendered correctly — title, description, image, breadcrumbs all worked — but the URL itself was a raw UUID
3. These UUID URLs appeared in the sitemap and Google index, reducing click-through rates

## Root Cause

The `slug` column on `public.generations` was added after the initial launch. Older records had `slug = NULL`. The detail page code fell back to the row's `id` (a UUID) when no slug was present:

```typescript
const image = {
  slug: dbRow.slug || dbRow.id,  // Falls back to UUID
  // ...
};
```

The sitemap had the same fallback:

```typescript
url: `${baseUrl}/${row.category}/${row.slug || row.id}`,
```

New generations were unaffected because `app/api/generate/route.ts` always generates a slug via `classifyPrompt()` and saves it as `uniqueSlug`:

```typescript
const classification = await classifyPrompt(prompt, style, contentType);
const suffix = Math.random().toString(36).slice(2, 8);
const uniqueSlug = `${classification.slug}-${suffix}`;
// ...
.insert({ slug: uniqueSlug, ... })
```

## Fix

### Database backfill (`db/backfill-slugs.sql`)

Ran a SQL migration that generates slugs from the `title` column for all rows where `slug IS NULL` or `slug` equals the UUID `id`:

```sql
UPDATE public.generations
SET slug = (
  SUBSTRING(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(title), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    ),
    1, 60
  ) || '-' || SUBSTR(MD5(RANDOM()::text), 1, 6)
)
WHERE title IS NOT NULL
  AND (slug IS NULL OR slug = id::text);
```

The slug format matches the application's `slugify()` function: lowercase, hyphens for non-alphanumeric characters, max 60 chars, plus a 6-character random suffix for uniqueness.

### Backward compatibility

No code changes were needed. The detail pages already query by both `slug` and `id`:

```typescript
const { data: bySlug } = await admin
  .from("generations")
  .select(...)
  .eq("slug", slug)
  .single();

if (bySlug) return bySlug;

const { data: byId } = await admin
  .from("generations")
  .select(...)
  .eq("id", slug)
  .single();
```

Any existing bookmarks or external links using the old UUID URLs continue to work because the `byId` fallback resolves them. New visitors and search engines now see the clean slug URLs.

## Files Changed

| File | Change |
|------|--------|
| `db/backfill-slugs.sql` | New — SQL migration script to generate slugs from titles for all legacy rows |

## Verification

After running the backfill, the verification query returned:

```
remaining_without_slug: 0
```

All public records now have human-readable slugs.

## Lessons

1. **Add slugs at the same time as titles** — if a record has a title, it should have a slug. These should be generated together, not as a separate migration later.
2. **UUID fallbacks are a code smell for SEO pages** — `slug || id` is a safe runtime fallback, but it masks a data quality issue. A NOT NULL constraint on `slug` with a generated default would prevent this class of bug.
3. **Check the sitemap for ugly URLs** — UUID-based URLs in `sitemap.xml` are an easy signal that slug generation is incomplete.
