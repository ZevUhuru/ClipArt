-- Add featured flag for curated homepage galleries
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer;

CREATE INDEX IF NOT EXISTS idx_generations_featured
  ON public.generations (featured_order ASC)
  WHERE is_featured = true;
