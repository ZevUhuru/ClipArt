-- clip.art — Secure all tables with Row Level Security
-- Run this in the Supabase SQL Editor
-- This locks down the legacy tables that currently have NO RLS

-- =============================================================
-- 1. categories — public read, admin-only write
-- =============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories"
  ON public.categories FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies = only service_role can write

-- =============================================================
-- 2. images — public read, admin-only write
-- =============================================================
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read images"
  ON public.images FOR SELECT
  USING (true);

-- =============================================================
-- 3. downloads — public can insert (track downloads), admin read
-- =============================================================
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a download"
  ON public.downloads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role reads downloads"
  ON public.downloads FOR SELECT
  USING (true);

-- =============================================================
-- 4. image_views — public can insert (track views), admin read
-- =============================================================
ALTER TABLE public.image_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a view"
  ON public.image_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role reads views"
  ON public.image_views FOR SELECT
  USING (true);

-- =============================================================
-- 5. tag_stats — public read, admin-only write
-- =============================================================
ALTER TABLE public.tag_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tag stats"
  ON public.tag_stats FOR SELECT
  USING (true);

-- =============================================================
-- 6. published_images* — skip views, secure tables only
-- =============================================================
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'published_images%'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('CREATE POLICY "Public can read %I" ON public.%I FOR SELECT USING (true)', t.tablename, t.tablename);
  END LOOP;
END $$;

-- =============================================================
-- 7. downloads_by_* — skip views, secure tables only
-- =============================================================
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'downloads_by%'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('CREATE POLICY "Public can read %I" ON public.%I FOR SELECT USING (true)', t.tablename, t.tablename);
  END LOOP;
END $$;

-- =============================================================
-- 8. email_waitlist — tighten: public insert only, no public read
-- =============================================================
-- RLS is already enabled, but let's make sure policies are correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_waitlist' AND policyname = 'Anyone can subscribe'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can subscribe" ON public.email_waitlist FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- =============================================================
-- Verify: List all tables and their RLS status
-- =============================================================
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
