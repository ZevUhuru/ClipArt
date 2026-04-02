-- Enable RLS and add policies for the animations table
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.animations ENABLE ROW LEVEL SECURITY;

-- 2. Public can read completed, public animations (for community grids / browse)
CREATE POLICY "Public can read public animations"
  ON public.animations FOR SELECT
  USING (is_public = true AND status = 'completed');

-- 3. Authenticated users can read their own animations (any status)
CREATE POLICY "Users can read own animations"
  ON public.animations FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Authenticated users can insert their own animations
CREATE POLICY "Users can insert own animations"
  ON public.animations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Service role handles updates (status, video_url, etc.) — no user UPDATE policy needed
