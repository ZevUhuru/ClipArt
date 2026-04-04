-- Add slug column to animations for detail page URLs
-- Run in Supabase SQL Editor

ALTER TABLE public.animations
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_animations_slug
  ON public.animations(slug) WHERE slug IS NOT NULL;

-- Backfill slugs from source generation title/prompt
UPDATE public.animations a
SET slug = sub.gen_slug
FROM (
  SELECT
    a2.id AS anim_id,
    lower(
      regexp_replace(
        regexp_replace(
          coalesce(g.title, g.prompt, a2.prompt, a2.id::text),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    ) || '-' || left(a2.id::text, 8) AS gen_slug
  FROM public.animations a2
  LEFT JOIN public.generations g ON g.id = a2.source_generation_id
  WHERE a2.slug IS NULL
) sub
WHERE a.id = sub.anim_id;
