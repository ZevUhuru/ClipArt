-- Add duration column to animation_prompts for duration-specific caching.
-- Existing rows default to 5 (the previous implicit duration).

ALTER TABLE public.animation_prompts
  ADD COLUMN IF NOT EXISTS duration integer NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_animation_prompts_gen_duration
  ON public.animation_prompts(generation_id, duration);
