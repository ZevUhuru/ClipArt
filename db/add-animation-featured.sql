-- Add curation flags for homepage featured animations
-- is_featured: controls the "AI Animated Clip Art" grid section below the fold
-- is_mosaic: controls which animations appear as video tiles in the hero mosaic

ALTER TABLE public.animations ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.animations ADD COLUMN IF NOT EXISTS is_mosaic boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_animations_featured ON public.animations(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_animations_mosaic ON public.animations(is_mosaic) WHERE is_mosaic = true;
