-- Add parent_id to generations for edit version chaining
-- parent_id is NULL for original generations, non-NULL for edits
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.generations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_generations_parent_id
  ON public.generations (parent_id) WHERE parent_id IS NOT NULL;
