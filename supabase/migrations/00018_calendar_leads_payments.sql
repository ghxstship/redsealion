-- Sprint D: Shifts + Calendar Sync

CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  call_time time,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_sync_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'ical')),
  external_calendar_id text,
  sync_token text,
  last_synced_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sprint E: Leads + Payments

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source text NOT NULL,
  company_name text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  event_type text,
  event_date date,
  estimated_budget numeric,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to uuid REFERENCES public.users(id),
  converted_to_deal_id uuid REFERENCES public.deals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  fields jsonb NOT NULL DEFAULT '[]',
  thank_you_message text,
  auto_response_enabled boolean NOT NULL DEFAULT false,
  auto_response_subject text,
  auto_response_body text,
  is_active boolean NOT NULL DEFAULT true,
  embed_token text NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  external_id text NOT NULL,
  url text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'expired')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shifts_org ON public.shifts(organization_id);
CREATE INDEX idx_shifts_venue ON public.shifts(venue_id);
CREATE INDEX idx_shifts_date ON public.shifts(date);
CREATE INDEX idx_calendar_sync_user ON public.calendar_sync_configs(user_id);
CREATE INDEX idx_leads_org ON public.leads(organization_id);
CREATE INDEX idx_leads_status ON public.leads(organization_id, status);
CREATE INDEX idx_lead_forms_org ON public.lead_forms(organization_id);
CREATE INDEX idx_payment_links_org ON public.payment_links(organization_id);
CREATE INDEX idx_payment_links_invoice ON public.payment_links(invoice_id);
CREATE INDEX idx_payment_links_external ON public.payment_links(external_id);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_org_access" ON public.shifts
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "calendar_sync_user_access" ON public.calendar_sync_configs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "leads_org_access" ON public.leads
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "lead_forms_org_access" ON public.lead_forms
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "payment_links_org_access" ON public.payment_links
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));
