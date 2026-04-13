-- Migration: Portal Guide Completeness
-- Purpose: Add all missing data points from productionsite.guide to the project_portals schema
-- so the interactive guide can be fully data-driven from the Red Sea Lion admin.
--
-- Reference: productionsite.guide data audit (21 gaps identified)

-- ─── Route-in instructions ─────────────────────────────────────────────────────
-- "Your Route In" section — distinct per portal type
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS route_in_instructions TEXT;

-- ─── Additional notes ──────────────────────────────────────────────────────────
-- "A Few More Things" bullet list — distinct per portal type
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS additional_notes JSONB DEFAULT '[]'::jsonb;

-- ─── Radio protocol ────────────────────────────────────────────────────────────
-- Radio etiquette paragraph — crew portals (production, operations, food_beverage)
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS radio_protocol TEXT;

-- ─── Safety rules ──────────────────────────────────────────────────────────────
-- Numbered safety rules list — crew portals have distinct variants
-- Structure: [{ "text": "No work above 6 feet without fall protection." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS safety_rules JSONB DEFAULT '[]'::jsonb;

-- ─── Emergency procedures ──────────────────────────────────────────────────────
-- 9 emergency codes (Red, Blue, Yellow, Orange, Green, Purple, Pink, White, Black)
-- + Full Evacuation procedure
-- Structure: [{ "code": "Code Red", "label": "Fire / Severe Weather", "channel": "CH 1",
--   "steps": ["Call 'Code Red'...", ...], "good_to_know": "Fire extinguishers..." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS emergency_procedures JSONB DEFAULT '[]'::jsonb;

-- ─── Evacuation info ───────────────────────────────────────────────────────────
-- Assembly point, EMS staging location, all-clear protocol
-- Structure: { "assembly_point": "...", "ems_staging": "...", "instructions": "..." }
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS evacuation_info JSONB;

-- ─── Accessibility (ADA) ───────────────────────────────────────────────────────
-- ADA entrance, viewing, restrooms, service animals, assistance
-- Structure: [{ "type": "ADA Entrance", "description": "Accessible entrance..." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS accessibility JSONB DEFAULT '[]'::jsonb;

-- ─── Crew intel ────────────────────────────────────────────────────────────────
-- Role-specific Q/A for crew portals (Production Office location, Wi-Fi, parking, etc.)
-- Uses same structure as faqs: [{ "q": "...", "a": "..." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS crew_intel JSONB DEFAULT '[]'::jsonb;

-- ─── Guest policies ────────────────────────────────────────────────────────────
-- Security & policies section: prohibited items, bag policy, re-entry, wristband, etc.
-- Structure: { "prohibited_items": [...], "bag_policy": "...", "re_entry_policy": "...",
--   "age_requirements": "...", "dress_code": "...", "smoking_policy": "..." }
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS guest_policies JSONB;

-- ─── External links ────────────────────────────────────────────────────────────
-- Ticket URL, event page URL, and any other external links
-- Structure: [{ "label": "Tickets", "url": "https://..." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb;

-- ─── Artist social links ───────────────────────────────────────────────────────
-- Instagram/social handles for artists on the lineup
-- Structure: [{ "name": "Black Coffee", "handle": "@realblackcoffee", "url": "https://..." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS artist_social_links JSONB DEFAULT '[]'::jsonb;

-- ─── Sustainability info ───────────────────────────────────────────────────────
-- Guest-facing sustainability section (water fountains, recycling, local sourcing)
-- Structure: [{ "type": "Water Fountains", "description": "Free water fountains..." }, ...]
ALTER TABLE project_portals
  ADD COLUMN IF NOT EXISTS sustainability JSONB DEFAULT '[]'::jsonb;
