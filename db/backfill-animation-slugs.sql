-- Backfill animation slugs (safe to re-run)
-- Run in Supabase SQL Editor

-- Step 1: Check how many are missing slugs
SELECT COUNT(*) AS missing_slugs
FROM public.animations
WHERE slug IS NULL;

-- Step 2: Backfill from source generation title, falling back to prompt
UPDATE public.animations a
SET slug = sub.gen_slug
FROM (
  SELECT
    a2.id AS anim_id,
    lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            coalesce(g.title, g.prompt, a2.prompt, 'animation'),
            '[^a-zA-Z0-9 -]', '', 'g'
          ),
          ' +', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    ) || '-' || left(a2.id::text, 8) AS gen_slug
  FROM public.animations a2
  LEFT JOIN public.generations g ON g.id = a2.source_generation_id
  WHERE a2.slug IS NULL
) sub
WHERE a.id = sub.anim_id;

-- Step 3: Verify
SELECT id, slug, left(prompt, 40) AS prompt_preview
FROM public.animations
ORDER BY created_at DESC
LIMIT 10;
