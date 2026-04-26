-- Backfill content_type for generations that predate the column.
--
-- All rows with content_type IS NULL were created before coloring pages and
-- illustrations shipped. Those features always set content_type explicitly, so
-- every null row is a clip art generation.
--
-- Safe to run multiple times (WHERE clause is a no-op after the first run).
-- Verify the count before committing:
--   SELECT count(*) FROM generations WHERE content_type IS NULL;

UPDATE generations
SET content_type = 'clipart'
WHERE content_type IS NULL;
