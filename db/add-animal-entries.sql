-- Animal Entries: structured animal data for encyclopedia-style pages
-- Run this in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.animal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter char(1) NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  scientific_name text,
  description text NOT NULL,
  fun_fact text,
  habitat text,
  diet text,
  size text,
  lifespan text,
  conservation_status text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_animal_entries_letter ON public.animal_entries(letter);
CREATE INDEX IF NOT EXISTS idx_animal_entries_active ON public.animal_entries(is_active);

ALTER TABLE public.animal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Animal entries are publicly readable"
  ON public.animal_entries FOR SELECT
  USING (true);
