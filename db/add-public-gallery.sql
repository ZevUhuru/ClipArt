-- Add gallery columns, full-text search, and public access to generations table
-- Run this in the Supabase SQL Editor

-- 1. New columns for gallery + search
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Allow user_id to be null (anonymous free generations)
ALTER TABLE public.generations
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Index for fast category page queries
CREATE INDEX IF NOT EXISTS idx_generations_public_category
  ON public.generations (category, created_at DESC)
  WHERE is_public = true;

-- 4. GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_generations_search
  ON public.generations USING GIN (search_vector);

-- 5. Auto-populate search_vector on insert/update
CREATE OR REPLACE FUNCTION generations_search_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.prompt, '') || ' ' ||
    coalesce(NEW.category, '') || ' ' ||
    coalesce(NEW.style, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generations_search ON public.generations;
CREATE TRIGGER trg_generations_search
  BEFORE INSERT OR UPDATE ON public.generations
  FOR EACH ROW EXECUTE FUNCTION generations_search_update();

-- 6. Public read policy for gallery images (anyone can browse public images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'generations' AND policyname = 'Public can read public generations'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read public generations" ON public.generations FOR SELECT USING (is_public = true)';
  END IF;
END $$;

-- 7. Backfill search_vector for any existing rows
UPDATE public.generations SET title = title WHERE true;
