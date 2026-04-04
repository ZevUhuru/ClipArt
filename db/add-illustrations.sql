-- Add content_type column to generations (two-axis: content_type x style)
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'clipart';

-- Backfill existing coloring rows
UPDATE public.generations SET content_type = 'coloring' WHERE style = 'coloring' AND content_type = 'clipart';

-- Index for efficient content type filtering
CREATE INDEX IF NOT EXISTS idx_generations_content_type ON public.generations(content_type);

-- Composite index for common queries (content_type + is_public)
CREATE INDEX IF NOT EXISTS idx_generations_content_type_public ON public.generations(content_type, is_public)
  WHERE is_public = true;

-- Seed illustration categories
INSERT INTO public.categories (slug, name, type, is_active, sort_order) VALUES
  ('fantasy-scenes', 'Fantasy Scenes', 'illustration', true, 1),
  ('nature-landscapes', 'Nature & Landscapes', 'illustration', true, 2),
  ('urban-scenes', 'Urban & City', 'illustration', true, 3),
  ('characters', 'Characters & People', 'illustration', true, 4),
  ('animals-scenes', 'Animals in Nature', 'illustration', true, 5),
  ('food-kitchen', 'Food & Kitchen', 'illustration', true, 6),
  ('seasonal', 'Seasonal & Holiday', 'illustration', true, 7),
  ('storybook-scenes', 'Storybook Scenes', 'illustration', true, 8),
  ('abstract-art', 'Abstract Art', 'illustration', true, 9),
  ('illustration-free', 'Other Illustrations', 'illustration', true, 0)
ON CONFLICT (slug) DO NOTHING;
