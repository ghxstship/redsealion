-- =============================================================================
-- Migration 00089: Compliance Module Gap Remediation
-- =============================================================================
-- Addresses schema gaps identified in the compliance module audit:
--   GAP-C1: Add 'contract' and 'permit' to document_type CHECK
--   GAP-C3: Add 'notes' column
--   GAP-H6/H11: Add 'issued_to' column
--   GAP-M4: Add composite index (organization_id, document_type)
--   GAP-M7: Add 'replaces_id' for document renewal chain
--   GAP-H10: Tighten RLS policies with role-based restrictions
--   GAP-L1: Add 'deleted_at' soft-delete column
--   GAP-M6: Add partial unique index for duplicate document detection
--   GAP-L3: Create enum type for document_type
-- =============================================================================

-- ---------------------------------------------------------------------------
-- GAP-L3: Create enum type for document_type
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE compliance_document_type AS ENUM (
    'coi', 'w9', 'w4', 'license', 'certification',
    'background_check', 'nda', 'i9', 'drivers_license',
    'contract', 'permit', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- GAP-C1: Expand document_type CHECK to include 'contract' and 'permit'
-- (Keep CHECK as a safety belt alongside the enum; column remains TEXT
--  for backwards-compat but new inserts are validated by CHECK.)
-- ---------------------------------------------------------------------------
ALTER TABLE compliance_documents
  DROP CONSTRAINT IF EXISTS compliance_documents_document_type_check;

ALTER TABLE compliance_documents
  ADD CONSTRAINT compliance_documents_document_type_check
  CHECK (document_type IN (
    'coi',
    'w9',
    'w4',
    'license',
    'certification',
    'background_check',
    'nda',
    'i9',
    'drivers_license',
    'contract',
    'permit',
    'other'
  ));

-- ---------------------------------------------------------------------------
-- GAP-C3: Add 'notes' column (referenced by PATCH API but missing)
-- ---------------------------------------------------------------------------
ALTER TABLE compliance_documents
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ---------------------------------------------------------------------------
-- GAP-H6/H11: Add 'issued_to' column (selected in queries but missing)
-- ---------------------------------------------------------------------------
ALTER TABLE compliance_documents
  ADD COLUMN IF NOT EXISTS issued_to TEXT;

-- ---------------------------------------------------------------------------
-- GAP-M7: Add 'replaces_id' for document renewal chain/version history
-- ---------------------------------------------------------------------------
ALTER TABLE compliance_documents
  ADD COLUMN IF NOT EXISTS replaces_id UUID REFERENCES compliance_documents(id);

-- ---------------------------------------------------------------------------
-- GAP-L1: Add 'deleted_at' soft-delete column
-- ---------------------------------------------------------------------------
ALTER TABLE compliance_documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- GAP-M4: Add composite index for org + document_type queries (hub tabs)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_compliance_documents_org_type
  ON compliance_documents(organization_id, document_type)
  WHERE deleted_at IS NULL;

-- Index on replaces_id for renewal chain lookups
CREATE INDEX IF NOT EXISTS idx_compliance_documents_replaces
  ON compliance_documents(replaces_id)
  WHERE replaces_id IS NOT NULL;

-- Index on deleted_at for soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_compliance_documents_deleted
  ON compliance_documents(deleted_at)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- GAP-M6: Partial unique index — prevent duplicate active docs per crew member
-- Only one active (non-expired, non-rejected, non-deleted) document per type
-- per crew member is allowed.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_one_active_per_type
  ON compliance_documents(crew_profile_id, document_type)
  WHERE status NOT IN ('expired', 'rejected')
    AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- GAP-H10: Tighten RLS — restrict UPDATE/DELETE to admin/owner/manager roles
-- ---------------------------------------------------------------------------
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can update compliance docs in their org" ON compliance_documents;
DROP POLICY IF EXISTS "Users can delete compliance docs in their org" ON compliance_documents;

-- Re-create with role checks
CREATE POLICY "Admins can update compliance docs in their org" ON compliance_documents
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete compliance docs in their org" ON compliance_documents
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('owner', 'admin', 'manager')
    )
  );

