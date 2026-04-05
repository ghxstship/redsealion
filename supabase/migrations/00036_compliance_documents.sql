-- Feature Parity: Compliance Document Management
-- Tracks contractor compliance documents (COI, W-9, licenses, etc.) per crew member

CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crew_profile_id UUID NOT NULL REFERENCES crew_profiles(id) ON DELETE CASCADE,
  
  -- Document metadata
  document_type TEXT NOT NULL CHECK (document_type IN (
    'coi',           -- Certificate of Insurance
    'w9',            -- W-9 Tax Form
    'w4',            -- W-4 Employee Withholding
    'license',       -- Professional License
    'certification', -- Industry Certification
    'background_check', -- Background Check
    'nda',           -- Non-Disclosure Agreement
    'i9',            -- Employment Eligibility
    'drivers_license', -- Driver's License
    'other'          -- Catch-all
  )),
  document_name TEXT NOT NULL,
  description TEXT,
  
  -- File storage
  file_url TEXT,
  file_name TEXT,
  file_size_bytes INTEGER,
  
  -- Validity tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Requested but not yet uploaded
    'uploaded',   -- Uploaded, awaiting verification
    'verified',   -- Reviewed and approved
    'expired',    -- Past expiry date
    'rejected'    -- Failed verification
  )),
  issued_date DATE,
  expiry_date DATE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_documents_org 
  ON compliance_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_crew 
  ON compliance_documents(crew_profile_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_expiry 
  ON compliance_documents(expiry_date) 
  WHERE expiry_date IS NOT NULL AND status != 'rejected';
CREATE INDEX IF NOT EXISTS idx_compliance_documents_status 
  ON compliance_documents(status);

-- RLS policies
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance docs in their org" ON compliance_documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert compliance docs in their org" ON compliance_documents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update compliance docs in their org" ON compliance_documents
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete compliance docs in their org" ON compliance_documents
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Add follow_up_count to proposals (for automation tracking)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;
