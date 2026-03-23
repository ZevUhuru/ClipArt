-- Site Settings table for admin-configurable options
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default model config (all styles use Gemini by default)
INSERT INTO site_settings (key, value) VALUES (
  'model_config',
  '{"flat":"gemini","outline":"gemini","cartoon":"gemini","sticker":"gemini","vintage":"gemini","watercolor":"gemini"}'
) ON CONFLICT (key) DO NOTHING;

-- RLS: only service role can access (admin API routes use service role)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- No public policies — only service_role key can read/write
-- This ensures the table is only accessible via admin API routes
