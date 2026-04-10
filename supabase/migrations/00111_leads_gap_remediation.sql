-- =============================================================================
-- Migration 00104: Leads Module Gap Remediation
-- =============================================================================
-- Resolves Critical C-01..C-05, High H-03/H-07/H-11, Medium M-05/M-06/M-07, Low L-05
-- =============================================================================

-- ---------------------------------------------------------------------------
-- C-01: Add deleted_at to leads (soft-delete support)
-- The API already filters .is('deleted_at', null) and DELETE sets it.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_active
  ON public.leads(organization_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- C-03: Make contact_email nullable
-- Many valid leads (phone calls, walk-ins) lack email.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ALTER COLUMN contact_email DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- H-03 + form_id FK: Link leads to the form that captured them
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES public.lead_forms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_form
  ON public.leads(form_id) WHERE form_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- M-06: Add created_by for audit attribution
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- M-07: Add lost_reason for pipeline analytics
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- ---------------------------------------------------------------------------
-- H-07: Persist lead score and tier for server-side sorting/filtering
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_tier TEXT NOT NULL DEFAULT 'cold';

-- ---------------------------------------------------------------------------
-- M-05: Add index on contact_email for dedup lookups
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_email
  ON public.leads(organization_id, contact_email) WHERE contact_email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- C-04 + C-05: Add missing columns to lead_forms
-- The UI expects description, status, and redirect_url.
-- ---------------------------------------------------------------------------
ALTER TABLE public.lead_forms
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- Add CHECK constraint for status values
DO $$
BEGIN
  ALTER TABLE public.lead_forms
    ADD CONSTRAINT lead_forms_status_check
    CHECK (status IN ('active', 'draft', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- H-03: Create lead_form_submissions junction table
-- Links form submissions to both the form and the resulting lead.
-- Enables submissions_count / last_submission_at computation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.lead_forms(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  raw_data JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form
  ON public.lead_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_org
  ON public.lead_form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_lead
  ON public.lead_form_submissions(lead_id) WHERE lead_id IS NOT NULL;

ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_form_submissions_org_read" ON public.lead_form_submissions
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "lead_form_submissions_org_write" ON public.lead_form_submissions
  FOR ALL USING (organization_id = auth_user_org_id());

-- ---------------------------------------------------------------------------
-- H-11: Create lead_activities table for audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'created', 'status_changed', 'assigned', 'converted', 'deleted', 'updated'
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead
  ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_org
  ON public.lead_activities(organization_id);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_activities_org_read" ON public.lead_activities
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "lead_activities_org_write" ON public.lead_activities
  FOR ALL USING (organization_id = auth_user_org_id());

-- ---------------------------------------------------------------------------
-- L-05: Ensure updated_at trigger is applied to lead_forms
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TRIGGER set_lead_forms_updated_at
    BEFORE UPDATE ON public.lead_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Seed data (M-09): Insert sample leads for development environments
-- Only inserts if no leads exist yet.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get the first org if it exists
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  IF v_org_id IS NULL THEN RETURN; END IF;

  -- Only seed if no leads exist for this org
  IF EXISTS (SELECT 1 FROM public.leads WHERE organization_id = v_org_id LIMIT 1) THEN RETURN; END IF;

  INSERT INTO public.leads (organization_id, source, company_name, contact_first_name, contact_last_name, contact_email, contact_phone, event_type, event_date, estimated_budget, message, status, score, score_tier) VALUES
    (v_org_id, 'Referral',       'Summit Productions',  'Rachel',  'Kim',      'rachel@summit.com',      '+1 555-100-1001', 'Corporate Gala',    '2026-06-15', 85000,  'Looking for full production for our annual gala.',   'new',       82, 'hot'),
    (v_org_id, 'Website',        'Neon Creative',       'Marcus',  'Chen',     'marcus@neoncreative.co', '+1 555-100-1002', 'Product Launch',    '2026-07-20', 120000, 'Need stage design and AV for product launch event.', 'contacted', 75, 'hot'),
    (v_org_id, 'LinkedIn',       NULL,                  'Amara',   'Okonkwo',  'amara@email.com',        NULL,              'Wedding',           '2026-09-10', 25000,  NULL,                                                 'qualified', 55, 'warm'),
    (v_org_id, 'Lead Form',      'Tech Forward Inc.',   'David',   'Park',     'dpark@techforward.io',   '+1 555-100-1003', 'Conference',        '2026-08-01', 200000, 'Multi-day tech conference. 2000 attendees expected.', 'new',       90, 'hot'),
    (v_org_id, 'Cold Outreach',  'Boutique Events Co.', 'Sarah',   'Miller',   'sarah@boutique.events',  NULL,              'Private Party',     '2026-05-30', 8000,   'Small gathering, simple setup needed.',              'contacted', 30, 'cold'),
    (v_org_id, 'Event',          'Metro Convention',    'James',   'Wright',   'jwright@metroconv.com',  '+1 555-100-1004', 'Trade Show',        '2026-10-15', 150000, 'Annual trade show booth design and build.',          'converted', 70, 'warm'),
    (v_org_id, 'Other',          NULL,                  'Lisa',    'Nguyen',   'lisa.n@gmail.com',       '+1 555-100-1005', NULL,                NULL,         NULL,   'Interested in learning about services.',             'lost',      15, 'cold');
END $$;
