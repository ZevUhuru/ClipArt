-- Add gallery flag for the /animations public page
-- is_gallery: controls which animations appear on the /animations browse page

ALTER TABLE public.animations ADD COLUMN IF NOT EXISTS is_gallery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_animations_gallery ON public.animations(is_gallery) WHERE is_gallery = true;
