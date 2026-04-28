-- Persist selected pack cover item.
-- Run this in the Supabase SQL Editor.

ALTER TABLE public.packs
ADD COLUMN IF NOT EXISTS cover_generation_id uuid REFERENCES public.generations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_packs_cover_generation_id
  ON public.packs(cover_generation_id);
