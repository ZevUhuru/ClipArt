-- Social sharing tables (multi-platform: YouTube, Instagram, TikTok, etc.)
-- Run this in the Supabase SQL Editor

-- 1. Social connections — one row per user per platform
CREATE TABLE IF NOT EXISTS public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  account_id text,
  account_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_provider CHECK (provider IN ('youtube', 'instagram', 'tiktok')),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_user
  ON public.social_connections(user_id);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connections"
  ON public.social_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage connections"
  ON public.social_connections FOR ALL USING (true) WITH CHECK (true);

-- 2. Social uploads — tracks every upload to any platform
CREATE TABLE IF NOT EXISTS public.social_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animation_id uuid REFERENCES public.animations(id) ON DELETE SET NULL,
  provider text NOT NULL,
  platform_video_id text,
  platform_url text,
  title text,
  status text NOT NULL DEFAULT 'uploading',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_upload_provider CHECK (provider IN ('youtube', 'instagram', 'tiktok')),
  CONSTRAINT valid_upload_status CHECK (status IN ('uploading', 'published', 'failed', 'removed'))
);

CREATE INDEX IF NOT EXISTS idx_social_uploads_user
  ON public.social_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_social_uploads_animation
  ON public.social_uploads(animation_id);

ALTER TABLE public.social_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own uploads"
  ON public.social_uploads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage uploads"
  ON public.social_uploads FOR ALL USING (true) WITH CHECK (true);
