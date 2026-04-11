-- Add model column to generations to track which AI model produced each image
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS model text DEFAULT 'gemini';
