-- Store the extracted last frame URL for completed animations
-- Used for video chaining (last frame → new animation source)
ALTER TABLE public.animations ADD COLUMN IF NOT EXISTS last_frame_url text;
