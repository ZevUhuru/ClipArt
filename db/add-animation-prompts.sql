-- Animation prompts persistence table
-- Stores AI-generated and user-written prompts per source image.
-- Acts as both a cache (avoid redundant Gemini calls) and a growing
-- prompt library that benefits all users.

CREATE TABLE IF NOT EXISTS public.animation_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt text NOT NULL,
  is_ai_generated boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_animation_prompts_generation ON public.animation_prompts(generation_id);
CREATE INDEX IF NOT EXISTS idx_animation_prompts_popular ON public.animation_prompts(use_count DESC);

-- RLS policies
ALTER TABLE public.animation_prompts ENABLE ROW LEVEL SECURITY;

-- Anyone can read public prompts
CREATE POLICY "Public prompts are readable by everyone"
  ON public.animation_prompts FOR SELECT
  USING (is_public = true);

-- Users can read their own private prompts
CREATE POLICY "Users can read own prompts"
  ON public.animation_prompts FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert their own prompts
CREATE POLICY "Users can insert own prompts"
  ON public.animation_prompts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own prompts (for use_count, etc.)
CREATE POLICY "Users can update own prompts"
  ON public.animation_prompts FOR UPDATE
  USING (auth.uid() = created_by);
