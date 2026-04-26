-- Add transparent_image_url column to preserve original image_url when bg is removed on-demand.
-- Auto bg-removal during generation overwrites image_url (already transparent).
-- On-demand bg-removal via the drawer stores the transparent version here.
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS transparent_image_url text;
