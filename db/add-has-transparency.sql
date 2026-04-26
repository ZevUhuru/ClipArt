-- Add has_transparency column to track whether a generation was produced with
-- an alpha-transparent background. Set at generation time based on whether
-- background: "transparent" was actually passed to the image API.
-- Defaults to false for all existing rows (pre-transparency-support catalog).

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS has_transparency boolean NOT NULL DEFAULT false;
