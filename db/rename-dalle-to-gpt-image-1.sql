-- Migration: rename the legacy "dalle" model key to "gpt-image-1".
--
-- Context: the internal key was historically "dalle" but has always called
-- OpenAI's gpt-image-1 model (never actual DALL-E). We are aligning the
-- stored identifier with the real model name now that gpt-image-2 is also
-- supported.
--
-- This migration rewrites:
--   1. site_settings row for key='model_config' — JSON values containing
--      "dalle" become "gpt-image-1" so admin overrides keep routing correctly.
--   2. generations.model — historical rows labeled "dalle" become
--      "gpt-image-1" so the detail drawer and analytics show the real model.
--
-- Safe to run multiple times (idempotent).

-- 1. Rewrite admin model_config overrides.
UPDATE site_settings
SET
  value = (
    SELECT jsonb_object_agg(
      key,
      CASE WHEN value::text = '"dalle"' THEN to_jsonb('gpt-image-1'::text) ELSE value END
    )
    FROM jsonb_each(value::jsonb)
  )::json,
  updated_at = NOW()
WHERE key = 'model_config'
  AND value::text LIKE '%"dalle"%';

-- 2. Rewrite historical generations.model values.
UPDATE generations
SET model = 'gpt-image-1'
WHERE model = 'dalle';

-- Verify: these should both return 0 rows after the migration.
-- SELECT * FROM site_settings WHERE key = 'model_config' AND value::text LIKE '%"dalle"%';
-- SELECT COUNT(*) FROM generations WHERE model = 'dalle';
