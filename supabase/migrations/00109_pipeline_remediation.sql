-- Pipeline Module Remediation Migration
-- Addresses gaps #11, #17, #24, #25, #27, #31, #33, #34, #35

-- ============================================================
-- #11: Soft delete on deals and deal_activities
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.deal_activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_deals_deleted_at ON public.deals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deal_activities_deleted_at ON public.deal_activities(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- #17: deal_contacts junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.client_contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'stakeholder', -- decision_maker, influencer, champion, stakeholder
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deal_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON public.deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON public.deal_contacts(contact_id);

ALTER TABLE public.deal_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view deal contacts" ON public.deal_contacts FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can manage deal contacts" ON public.deal_contacts FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

-- ============================================================
-- #24: source and lead_id fields on deals
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deals_lead ON public.deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_source ON public.deals(source);

-- ============================================================
-- #25: currency_code on deals
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'USD';

-- ============================================================
-- #27: stage_entered_at for stage duration analytics
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================
-- #31: updated_at on deal_activities
-- ============================================================
ALTER TABLE public.deal_activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE TRIGGER update_deal_activities_updated_at
  BEFORE UPDATE ON public.deal_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- #33: priority field on deals
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- ============================================================
-- #34: deal_number auto-increment
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_number TEXT;

CREATE OR REPLACE FUNCTION generate_deal_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN deal_number ~ '^DEAL-[0-9]+$'
    THEN CAST(SUBSTRING(deal_number FROM 6) AS INTEGER)
    ELSE 0 END
  ), 0) + 1
  INTO next_num
  FROM public.deals
  WHERE organization_id = org_id;
  RETURN 'DEAL-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- #35: reopened_at and reopen_count
-- ============================================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS reopen_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ;

-- ============================================================
-- #23: deal_tags system
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deal_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deal_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_deal_tags_deal ON public.deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_org_tag ON public.deal_tags(organization_id, tag);

ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view deal tags" ON public.deal_tags FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can manage deal tags" ON public.deal_tags FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());
