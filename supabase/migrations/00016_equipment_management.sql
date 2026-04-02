-- Sprint B: Equipment Management

CREATE TABLE public.equipment_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.equipment_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  reserved_from date NOT NULL,
  reserved_until date NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_out', 'returned', 'cancelled')),
  checked_out_by uuid REFERENCES public.users(id),
  checked_out_at timestamptz,
  returned_by uuid REFERENCES public.users(id),
  returned_at timestamptz,
  condition_on_return text CHECK (condition_on_return IS NULL OR condition_on_return IN ('new', 'excellent', 'good', 'fair', 'poor', 'damaged')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('repair', 'inspection', 'cleaning', 'calibration')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'complete', 'cancelled')),
  description text,
  scheduled_date date NOT NULL,
  completed_date date,
  cost numeric,
  performed_by uuid REFERENCES public.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipment_bundles_org ON public.equipment_bundles(organization_id);
CREATE INDEX idx_equipment_reservations_org ON public.equipment_reservations(organization_id);
CREATE INDEX idx_equipment_reservations_asset ON public.equipment_reservations(asset_id);
CREATE INDEX idx_equipment_reservations_dates ON public.equipment_reservations(reserved_from, reserved_until);
CREATE INDEX idx_equipment_reservations_proposal ON public.equipment_reservations(proposal_id);
CREATE INDEX idx_maintenance_records_org ON public.maintenance_records(organization_id);
CREATE INDEX idx_maintenance_records_asset ON public.maintenance_records(asset_id);

ALTER TABLE public.equipment_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_bundles_org_access" ON public.equipment_bundles
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "equipment_reservations_org_access" ON public.equipment_reservations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "maintenance_records_org_access" ON public.maintenance_records
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));
