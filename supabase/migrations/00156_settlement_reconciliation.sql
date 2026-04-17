-- ============================================================
-- 00156: Settlement + Reconciliation tables
--
-- Closes closure tickets C-FLOW-03, C-FLOW-10, C-FLOW-12,
-- C-FLOW-13, C-FLOW-16, C-FLOW-17, C-FLOW-21, C-FLOW-22, C-FLOW-23.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Dock slots
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dock_slots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid,
  venue_id        uuid,
  window_from     timestamptz NOT NULL,
  window_until    timestamptz NOT NULL,
  capacity        integer NOT NULL DEFAULT 1,
  reserved_by_po_id uuid,
  reserved_by_vendor_id uuid,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (window_until > window_from)
);

CREATE INDEX IF NOT EXISTS idx_dock_slots_project_window
  ON public.dock_slots(project_id, window_from);

ALTER TABLE public.dock_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY dock_slots_org_scope ON public.dock_slots
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 2: PO 3-way match
-- ─────────────────────────────────────────────────────────────

CREATE TYPE po_match_status AS ENUM ('matched','partial','mismatched','pending','disputed');

CREATE TABLE IF NOT EXISTS public.po_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  po_id           uuid NOT NULL,
  invoice_id      uuid,
  receipt_id      uuid,
  bol_id          uuid,
  match_status    po_match_status NOT NULL DEFAULT 'pending',
  variance_amount numeric(14,2) NOT NULL DEFAULT 0,
  matched_by      uuid,
  matched_at      timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_matches_po ON public.po_matches(po_id);
CREATE INDEX IF NOT EXISTS idx_po_matches_invoice ON public.po_matches(invoice_id);

ALTER TABLE public.po_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_matches_org_scope ON public.po_matches
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='purchase_orders') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.po_matches
                 ADD CONSTRAINT po_match_po_fk
                 FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='invoices') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.po_matches
                 ADD CONSTRAINT po_match_invoice_fk
                 FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Damage reports
-- ─────────────────────────────────────────────────────────────

CREATE TYPE damage_severity AS ENUM ('minor','moderate','major','total_loss');
CREATE TYPE damage_status   AS ENUM ('filed','reviewing','adjudicated','paid','rejected','disputed');

CREATE TABLE IF NOT EXISTS public.damage_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid,
  vendor_id       uuid,
  equipment_id    uuid,
  severity        damage_severity NOT NULL,
  description     text NOT NULL,
  amount_claimed  numeric(14,2) NOT NULL DEFAULT 0,
  amount_settled  numeric(14,2) NOT NULL DEFAULT 0,
  filed_by        uuid,
  adjudicated_by  uuid,
  adjudicated_at  timestamptz,
  status          damage_status NOT NULL DEFAULT 'filed',
  evidence_ids    uuid[] NOT NULL DEFAULT '{}'::uuid[],
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_damage_reports_project ON public.damage_reports(project_id, status);

ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY damage_reports_org_scope ON public.damage_reports
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Vendor ledgers + per diem + travel enums
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendor_ledgers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vendor_id       uuid NOT NULL,
  project_id      uuid,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  po_total        numeric(14,2) NOT NULL DEFAULT 0,
  paid_total      numeric(14,2) NOT NULL DEFAULT 0,
  disputed_total  numeric(14,2) NOT NULL DEFAULT 0,
  generated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, project_id, period_start, period_end)
);

ALTER TABLE public.vendor_ledgers ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_ledgers_org_scope ON public.vendor_ledgers
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TYPE meal_mode AS ENUM ('catered','buyout','per_diem_food');
CREATE TYPE lodging_mode AS ENUM ('provided','per_diem_buyout','own_accommodation');
CREATE TYPE transport_mode AS ENUM ('shuttle','rental','personal','rideshare','provided_car');

CREATE TABLE IF NOT EXISTS public.per_diem (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL,
  user_id         uuid,
  person_id       uuid REFERENCES public.people(id) ON DELETE SET NULL,
  daily_rate      numeric(10,2) NOT NULL DEFAULT 0,
  days            integer NOT NULL DEFAULT 1,
  meal_mode       meal_mode NOT NULL DEFAULT 'per_diem_food',
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.per_diem ENABLE ROW LEVEL SECURITY;
CREATE POLICY per_diem_org_scope ON public.per_diem
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='travel_bookings') THEN
    EXECUTE 'ALTER TABLE public.travel_bookings
               ADD COLUMN IF NOT EXISTS lodging_mode lodging_mode,
               ADD COLUMN IF NOT EXISTS transport_mode transport_mode';
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 5: Budget reconciliations
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budget_reconciliations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL,
  signed_by       uuid,
  signed_at       timestamptz,
  variance_total  numeric(14,2) NOT NULL DEFAULT 0,
  line_items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes           text,
  doc_id          uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_recon_org_scope ON public.budget_reconciliations
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 6: Activation metrics + pool slots already seeded in 00154
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activation_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activation_id   uuid NOT NULL,
  ts              timestamptz NOT NULL DEFAULT now(),
  impressions     integer NOT NULL DEFAULT 0,
  scans           integer NOT NULL DEFAULT 0,
  interactions    integer NOT NULL DEFAULT 0,
  source          text
);

CREATE INDEX IF NOT EXISTS idx_activation_metrics_activation_ts
  ON public.activation_metrics(activation_id, ts DESC);

ALTER TABLE public.activation_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY activation_metrics_org_scope ON public.activation_metrics
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 7: Green room assignments (talent)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.green_room_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_record_id uuid,
  space_id        uuid,
  window_from     timestamptz NOT NULL,
  window_until    timestamptz NOT NULL,
  amenities       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (window_until > window_from)
);

ALTER TABLE public.green_room_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY green_room_org_scope ON public.green_room_assignments
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ============================================================
-- End of 00156
-- ============================================================
