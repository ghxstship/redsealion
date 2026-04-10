-- =============================================================================
-- Migration 00090: Client Module Gap Remediation
-- =============================================================================
-- Fixes identified in the Clients Module operational gap audit:
--   1. Add city, state, country to clients (C-03)
--   2. Add updated_at to client_interactions (H-10)
--   3. Add deleted_at to client_contacts (H-11)
--   4. Add unique constraint on company_name per org (M-02)
--   5. Add unique constraint on contact email per client (L-04)
--   6. Ensure updated_at trigger on client_contacts (L-05)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. GEOGRAPHIC COLUMNS ON CLIENTS (C-03)
-- ═══════════════════════════════════════════════════════════════════════
-- The Map and Segments hub tabs query city/state/country directly.
-- While billing_address JSONB stores these, top-level columns enable
-- filtering, indexing, and direct Supabase select().

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Backfill from billing_address JSONB where available
UPDATE public.clients SET
  city    = COALESCE(city, billing_address->>'city'),
  state   = COALESCE(state, billing_address->>'state'),
  country = COALESCE(country, billing_address->>'country', 'US')
WHERE billing_address IS NOT NULL
  AND (city IS NULL OR state IS NULL);

CREATE INDEX IF NOT EXISTS idx_clients_geo ON public.clients(organization_id, state, city)
  WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. UPDATED_AT ON CLIENT_INTERACTIONS (H-10)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.client_interactions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_client_interactions
    BEFORE UPDATE ON public.client_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. SOFT DELETE ON CLIENT_CONTACTS (H-11)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.client_contacts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_client_contacts_active
  ON public.client_contacts(client_id)
  WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. UNIQUE COMPANY NAME PER ORG (M-02)
-- ═══════════════════════════════════════════════════════════════════════
-- Prevents duplicate client records within an organization.

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_unique_name
  ON public.clients(organization_id, lower(company_name))
  WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. UNIQUE CONTACT EMAIL PER CLIENT (L-04)
-- ═══════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_unique_email
  ON public.client_contacts(client_id, lower(email))
  WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. UPDATED_AT TRIGGER ON CLIENT_CONTACTS (L-05)
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_client_contacts
    BEFORE UPDATE ON public.client_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
