-- Add density preference column to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS density TEXT NOT NULL DEFAULT 'comfortable'
  CHECK (density IN ('comfortable', 'compact'));
