-- Backfill slugs for generations that have a title but no slug (or slug = id).
-- Generates a URL-friendly slug from the title + a short random suffix for uniqueness.
--
-- Run with: psql $DATABASE_URL -f db/backfill-slugs.sql
-- Or paste into Supabase SQL Editor.

-- Step 1: Preview affected rows
SELECT id, title, slug, content_type, created_at
FROM public.generations
WHERE is_public = true
  AND title IS NOT NULL
  AND (slug IS NULL OR slug = id::text)
ORDER BY created_at DESC
LIMIT 20;

-- Step 2: Backfill slugs from title
-- Uses: lowercase, replace non-alnum with hyphens, trim hyphens, truncate to 60 chars, append 6-char random suffix
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

-- Step 3: Verify — count remaining rows without proper slugs
SELECT COUNT(*) AS remaining_without_slug
FROM public.generations
WHERE is_public = true
  AND (slug IS NULL OR slug = id::text);
