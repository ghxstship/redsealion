-- Sprint F: Onboarding Documents

CREATE TABLE public.onboarding_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('w9', 'nda', 'i9', 'direct_deposit', 'emergency_contact', 'other')),
  name text NOT NULL,
  file_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected')),
  verified_by uuid REFERENCES public.users(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sprint G: Warehouse Transfers

CREATE TABLE public.warehouse_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_facility_id text NOT NULL,
  to_facility_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
  initiated_by uuid NOT NULL REFERENCES public.users(id),
  items jsonb NOT NULL DEFAULT '[]',
  shipped_at timestamptz,
  received_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_documents_org ON public.onboarding_documents(organization_id);
CREATE INDEX idx_onboarding_documents_user ON public.onboarding_documents(user_id);
CREATE INDEX idx_warehouse_transfers_org ON public.warehouse_transfers(organization_id);
CREATE INDEX idx_warehouse_transfers_status ON public.warehouse_transfers(organization_id, status);

ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_documents_org_access" ON public.onboarding_documents
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "warehouse_transfers_org_access" ON public.warehouse_transfers
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));
