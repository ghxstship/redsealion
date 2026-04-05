-- Feature Parity Tiers 2 & 3: Unified Migration
-- 3NF-compliant schema additions for 8 features

-- ═══════════════════════════════════════════════════════
-- 1. WORK ORDER DISPATCH
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  wo_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  
  -- Location
  location_name TEXT,
  location_address TEXT,
  
  -- Scheduling
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Crew assignment (many-to-many via junction table)
  dispatched_by UUID REFERENCES users(id),
  dispatched_at TIMESTAMPTZ,
  
  -- Completion
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Checklist (JSONB array for inline items)
  checklist JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction: work order ↔ crew assignments
CREATE TABLE IF NOT EXISTS work_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  crew_profile_id UUID NOT NULL REFERENCES crew_profiles(id) ON DELETE CASCADE,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'accepted', 'declined', 'completed'
  )),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(work_order_id, crew_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_proposal ON work_orders(proposal_id) WHERE proposal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wo_assignments_wo ON work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_crew ON work_order_assignments(crew_profile_id);

-- ═══════════════════════════════════════════════════════
-- 2. JOB-SITE PHOTO CAPTURE
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_site_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic parent: can belong to a task, work order, or proposal
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT,
  
  -- Geolocation
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Metadata
  caption TEXT,
  photo_type TEXT NOT NULL DEFAULT 'progress' CHECK (photo_type IN (
    'before', 'progress', 'completion', 'issue', 'reference'
  )),
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_photos_task ON job_site_photos(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_photos_wo ON job_site_photos(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_photos_org ON job_site_photos(organization_id);

-- ═══════════════════════════════════════════════════════
-- 3. DEPOSIT & UPFRONT PAYMENTS
-- ═══════════════════════════════════════════════════════

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(5,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deposit_invoice_id UUID REFERENCES invoices(id);

-- ═══════════════════════════════════════════════════════
-- 4. AI PROPOSAL DRAFTING (no schema — uses existing tables)
-- ═══════════════════════════════════════════════════════

-- No new tables needed. Uses proposals, phases, phase_deliverables.
-- AI drafting is a server-side generation call.

-- ═══════════════════════════════════════════════════════
-- 5. CREW PERFORMANCE RATINGS
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crew_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crew_profile_id UUID NOT NULL REFERENCES crew_profiles(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  categories JSONB DEFAULT '{}', -- e.g. {"punctuality": 5, "quality": 4, "communication": 5}
  comment TEXT,
  
  rated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_ratings_crew ON crew_ratings(crew_profile_id);
CREATE INDEX IF NOT EXISTS idx_crew_ratings_org ON crew_ratings(organization_id);

-- Denormalized avg rating on crew_profiles for fast reads
ALTER TABLE crew_profiles ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2);
ALTER TABLE crew_profiles ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════════════
-- 6. REFERRAL PROGRAM
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL DEFAULT 'Client Referral Program',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  reward_type TEXT NOT NULL DEFAULT 'fixed' CHECK (reward_type IN ('fixed', 'percentage')),
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 100,
  reward_currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Conditions
  min_invoice_value NUMERIC(10,2),
  require_paid_invoice BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES referral_programs(id) ON DELETE CASCADE,
  
  referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  
  referred_name TEXT,
  referred_email TEXT,
  referred_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'signed_up', 'converted', 'rewarded', 'expired'
  )),
  
  reward_amount NUMERIC(10,2),
  reward_credited_at TIMESTAMPTZ,
  
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_org ON referrals(organization_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id);

-- ═══════════════════════════════════════════════════════
-- 7. EMAIL CAMPAIGNS
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'sending', 'sent', 'cancelled'
  )),
  
  -- Targeting
  target_tags TEXT[] DEFAULT '{}', -- Client tag filters
  target_all_clients BOOLEAN DEFAULT false,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'
  )),
  
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  UNIQUE(campaign_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);

-- ═══════════════════════════════════════════════════════
-- 8. REVIEW REQUESTS (no new table — uses automations + audit_log)
-- ═══════════════════════════════════════════════════════

-- Review request settings stored in org-level config
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS review_request_config JSONB DEFAULT '{}';

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES (all new tables)
-- ═══════════════════════════════════════════════════════

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_site_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Macro for org-scoped read
CREATE OR REPLACE FUNCTION user_org_ids() RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_memberships
  WHERE user_id = auth.uid() AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- work_orders
CREATE POLICY "org_read_work_orders" ON work_orders FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_write_work_orders" ON work_orders FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_work_orders" ON work_orders FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_work_orders" ON work_orders FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- work_order_assignments
CREATE POLICY "org_read_wo_assignments" ON work_order_assignments FOR SELECT USING (
  work_order_id IN (SELECT id FROM work_orders WHERE organization_id IN (SELECT user_org_ids()))
);
CREATE POLICY "org_write_wo_assignments" ON work_order_assignments FOR INSERT WITH CHECK (
  work_order_id IN (SELECT id FROM work_orders WHERE organization_id IN (SELECT user_org_ids()))
);
CREATE POLICY "org_update_wo_assignments" ON work_order_assignments FOR UPDATE USING (
  work_order_id IN (SELECT id FROM work_orders WHERE organization_id IN (SELECT user_org_ids()))
);
CREATE POLICY "org_delete_wo_assignments" ON work_order_assignments FOR DELETE USING (
  work_order_id IN (SELECT id FROM work_orders WHERE organization_id IN (SELECT user_org_ids()))
);

-- job_site_photos
CREATE POLICY "org_read_job_photos" ON job_site_photos FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_write_job_photos" ON job_site_photos FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_job_photos" ON job_site_photos FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- crew_ratings
CREATE POLICY "org_read_crew_ratings" ON crew_ratings FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_write_crew_ratings" ON crew_ratings FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

-- referral_programs
CREATE POLICY "org_read_referral_programs" ON referral_programs FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_write_referral_programs" ON referral_programs FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_referral_programs" ON referral_programs FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

-- referrals
CREATE POLICY "org_read_referrals" ON referrals FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_write_referrals" ON referrals FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_referrals" ON referrals FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

-- campaigns
CREATE POLICY "org_read_campaigns" ON campaigns FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_write_campaigns" ON campaigns FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_campaigns" ON campaigns FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_campaigns" ON campaigns FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- campaign_recipients
CREATE POLICY "org_read_campaign_recipients" ON campaign_recipients FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids()))
);
CREATE POLICY "org_write_campaign_recipients" ON campaign_recipients FOR INSERT WITH CHECK (
  campaign_id IN (SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids()))
);
