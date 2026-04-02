-- Animations table for Kling video generation via Fal.ai
CREATE TABLE IF NOT EXISTS public.animations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_generation_id uuid REFERENCES public.generations(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  model text NOT NULL DEFAULT 'kling-3.0-standard',
  duration integer NOT NULL DEFAULT 5,
  generate_audio boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'processing',
  fal_request_id text,
  video_url text,
  preview_url text,
  thumbnail_url text,
  credits_charged integer NOT NULL DEFAULT 5,
  error_message text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_animations_user_id ON public.animations(user_id);
CREATE INDEX IF NOT EXISTS idx_animations_status ON public.animations(status) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_animations_source ON public.animations(source_generation_id) WHERE source_generation_id IS NOT NULL;
