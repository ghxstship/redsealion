-- ============================================================================
-- Add is_favorite column to saved_views for view pinning/favorites
-- Migration: 00035_saved_views_favorites
-- ============================================================================

ALTER TABLE public.saved_views
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;
