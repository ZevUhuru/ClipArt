-- Add aspect_ratio column to generations table
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT '1:1';

-- Add coloring-pages theme categories for SEO
-- These are seeded as coloring page themes; actual category pages come in Phase 2
