-- ============================================================
-- FILES MODULE REMEDIATION
-- 1. Create missing storage buckets
-- 2. Refactor file_attachments to support polymorphic/multiple entities
-- 3. Apply standard RLS to file buckets
-- ============================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('attachments', 'attachments', false),
  ('compliance-documents', 'compliance-documents', false),
  ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Modify file_attachments
ALTER TABLE file_attachments
  ALTER COLUMN proposal_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_latest BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Backfill organization_id based on proposal_id
UPDATE file_attachments fa
SET organization_id = p.organization_id
FROM proposals p
WHERE fa.proposal_id = p.id AND fa.organization_id IS NULL;

-- Create an index to support faster lookups by org
CREATE INDEX IF NOT EXISTS idx_file_attachments_org ON file_attachments(organization_id);

CREATE OR REPLACE FUNCTION is_client_user() RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM client_contacts WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old rigid policies
DROP POLICY IF EXISTS "files_select" ON file_attachments;
DROP POLICY IF EXISTS "files_modify" ON file_attachments;

-- Apply simplified, robust policies
DROP POLICY IF EXISTS "files_select" ON file_attachments;
CREATE POLICY "files_select" ON file_attachments FOR SELECT
  USING (
    organization_id = auth_user_org_id() 
    AND (
      is_producer_role() 
      OR is_client_visible
      OR is_client_user()
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "files_modify" ON file_attachments;
CREATE POLICY "files_modify" ON file_attachments FOR ALL
  USING (
    organization_id = auth_user_org_id()
  );

-- 3. Storage Policies
-- Note: 'authenticated' users can modify their own files. More stringent checks can be placed
-- in the API route, but this baseline prevents public access.
DROP POLICY IF EXISTS "storage_buckets_select" ON storage.objects;
CREATE POLICY "storage_buckets_select" ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('attachments', 'compliance-documents', 'receipts')
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "storage_buckets_insert" ON storage.objects;
CREATE POLICY "storage_buckets_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('attachments', 'compliance-documents', 'receipts')
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "storage_buckets_delete" ON storage.objects;
CREATE POLICY "storage_buckets_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('attachments', 'compliance-documents', 'receipts')
    AND auth.role() = 'authenticated'
  );
