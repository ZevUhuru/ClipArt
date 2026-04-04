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
INSERT INTO public.categories (slug, name, h1, type, is_active, sort_order) VALUES
  ('fantasy-scenes', 'Fantasy Scenes', 'Fantasy Scene Illustrations', 'illustration', true, 1),
  ('nature-landscapes', 'Nature & Landscapes', 'Nature & Landscape Illustrations', 'illustration', true, 2),
  ('urban-scenes', 'Urban & City', 'Urban & City Illustrations', 'illustration', true, 3),
  ('characters', 'Characters & People', 'Character & People Illustrations', 'illustration', true, 4),
  ('animals-scenes', 'Animals in Nature', 'Animals in Nature Illustrations', 'illustration', true, 5),
  ('food-kitchen', 'Food & Kitchen', 'Food & Kitchen Illustrations', 'illustration', true, 6),
  ('seasonal', 'Seasonal & Holiday', 'Seasonal & Holiday Illustrations', 'illustration', true, 7),
  ('storybook-scenes', 'Storybook Scenes', 'Storybook Scene Illustrations', 'illustration', true, 8),
  ('abstract-art', 'Abstract Art', 'Abstract Art Illustrations', 'illustration', true, 9),
  ('illustration-free', 'Other Illustrations', 'Other Illustrations', 'illustration', true, 0)
ON CONFLICT (slug) DO NOTHING;
