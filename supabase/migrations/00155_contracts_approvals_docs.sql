-- ============================================================
-- 00155: Contract, Approval, and Document Canonicalization
--
-- Closes closure tickets C-DOC-01..09, C-FLOW-01, C-FLOW-07,
-- C-FLOW-14, C-FLOW-20, and extends the existing change_orders
-- table to support polymorphic subjects.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Contract templates + instances
-- ─────────────────────────────────────────────────────────────

CREATE TYPE contract_kind AS ENUM (
  'msa','sow','deal_memo','performance_agreement','rider',
  'vendor_sow','sponsorship','photo_release','embargo','nda','other'
);

CREATE TYPE contract_instance_status AS ENUM (
  'draft','sent','signed','countersigned','expired','voided','disputed'
);

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind           contract_kind NOT NULL,
  name           text NOT NULL,
  version        integer NOT NULL DEFAULT 1,
  body_md        text,
  body_docx_doc_id uuid,
  fields_schema  jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published   boolean NOT NULL DEFAULT false,
  published_at   timestamptz,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, kind, name, version)
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_templates_org_scope ON public.contract_templates
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.contract_instances (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id         uuid,
  template_id        uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  kind               contract_kind NOT NULL,
  counterparty_type  text,
  counterparty_id    uuid,
  subject_person_id  uuid REFERENCES public.people(id) ON DELETE SET NULL,
  signed_doc_id      uuid,
  signed_at          timestamptz,
  countersigned_at   timestamptz,
  effective_at       timestamptz,
  expires_at         timestamptz,
  status             contract_instance_status NOT NULL DEFAULT 'draft',
  fields             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_instances_project ON public.contract_instances(project_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_instances_kind ON public.contract_instances(kind, status);

ALTER TABLE public.contract_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_instances_org_scope ON public.contract_instances
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 2: MSA agreements (typed shortcut on top of contract_instances)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.msa_agreements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_instance_id uuid REFERENCES public.contract_instances(id) ON DELETE CASCADE,
  counterparty_type text NOT NULL,
  counterparty_id   uuid NOT NULL,
  effective_at      timestamptz,
  expires_at        timestamptz,
  auto_renewal      boolean NOT NULL DEFAULT false,
  notice_days       integer,
  signed_doc_id     uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.msa_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY msa_org_scope ON public.msa_agreements
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Riders + rider line items
-- ─────────────────────────────────────────────────────────────

CREATE TYPE rider_type AS ENUM ('technical','hospitality','media','security','logistics','other');
CREATE TYPE rider_line_status AS ENUM ('requested','confirmed','fulfilled','substituted','waived','disputed');

CREATE TABLE IF NOT EXISTS public.riders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid,
  talent_record_id uuid,
  contract_instance_id uuid REFERENCES public.contract_instances(id) ON DELETE SET NULL,
  type            rider_type NOT NULL,
  body_md         text,
  attachments     uuid[] NOT NULL DEFAULT '{}'::uuid[],
  locked_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY riders_org_scope ON public.riders
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.rider_line_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rider_id        uuid NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  item            text NOT NULL,
  qty             integer NOT NULL DEFAULT 1,
  unit            text,
  status          rider_line_status NOT NULL DEFAULT 'requested',
  fulfilled_by    uuid,
  fulfilled_at    timestamptz,
  substitute_of   uuid,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rider_lines_rider ON public.rider_line_items(rider_id);

ALTER TABLE public.rider_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY rider_lines_org_scope ON public.rider_line_items
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Approvals + approval chains
-- ─────────────────────────────────────────────────────────────

CREATE TYPE approval_chain_kind AS ENUM (
  'advance','purchase_order','change_order','invoice','budget_reconciliation','settlement','release','deliverable','other'
);
CREATE TYPE approval_decision AS ENUM ('pending','approved','rejected','skipped','delegated');

CREATE TABLE IF NOT EXISTS public.approval_chains (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind            approval_chain_kind NOT NULL,
  name            text NOT NULL,
  min_approvers   integer NOT NULL DEFAULT 1,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_chains_org_scope ON public.approval_chains
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.approval_chain_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  chain_id        uuid NOT NULL REFERENCES public.approval_chains(id) ON DELETE CASCADE,
  step_order      integer NOT NULL,
  role            project_role,
  specific_user_id uuid,
  is_required     boolean NOT NULL DEFAULT true,
  UNIQUE (chain_id, step_order)
);

ALTER TABLE public.approval_chain_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_steps_org_scope ON public.approval_chain_steps
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  chain_id        uuid REFERENCES public.approval_chains(id) ON DELETE SET NULL,
  chain_step_id   uuid REFERENCES public.approval_chain_steps(id) ON DELETE SET NULL,
  project_id      uuid,
  subject_type    text NOT NULL,
  subject_id      uuid NOT NULL,
  approver_user_id uuid,
  approver_role   project_role,
  decision        approval_decision NOT NULL DEFAULT 'pending',
  comment         text,
  decided_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_subject
  ON public.approvals(subject_type, subject_id);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY approvals_org_scope ON public.approvals
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 5: Change orders — extend existing 00008 table
-- ─────────────────────────────────────────────────────────────

-- Existing change_orders schema is proposal-scoped. Extend for polymorphic
-- subject and project-scoping without breaking current consumers.
ALTER TABLE public.change_orders
  ADD COLUMN IF NOT EXISTS project_id      uuid,
  ADD COLUMN IF NOT EXISTS subject_type    text,
  ADD COLUMN IF NOT EXISTS subject_id      uuid,
  ADD COLUMN IF NOT EXISTS requester_user_id uuid,
  ADD COLUMN IF NOT EXISTS approvals_chain_id uuid REFERENCES public.approval_chains(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by     uuid;

CREATE INDEX IF NOT EXISTS idx_change_orders_subject
  ON public.change_orders(subject_type, subject_id) WHERE subject_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_change_orders_project
  ON public.change_orders(project_id) WHERE project_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- STEP 6: Supporting compliance tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.direct_deposit_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL,
  account_last4     text NOT NULL,
  routing_last4     text NOT NULL,
  account_holder_name text,
  voided_check_doc_id uuid,
  verified_at       timestamptz,
  verified_by       uuid,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_deposit_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY dd_org_scope ON public.direct_deposit_records
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.cert_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  person_id       uuid REFERENCES public.people(id) ON DELETE SET NULL,
  user_id         uuid,
  cert_type       text NOT NULL,
  issuer          text,
  cert_number     text,
  issued_at       timestamptz,
  expires_at      timestamptz,
  doc_id          uuid,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked','pending')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cert_registry_expiry
  ON public.cert_registry(expires_at) WHERE status = 'active';

ALTER TABLE public.cert_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY cert_registry_org_scope ON public.cert_registry
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TYPE vendor_credential_kind AS ENUM (
  'coi','w9','w8_ben','w8_ben_e','msa','insurance_addl','license','safety_plan','other'
);

CREATE TABLE IF NOT EXISTS public.vendor_credentials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vendor_id       uuid NOT NULL,
  kind            vendor_credential_kind NOT NULL,
  doc_id          uuid,
  issued_at       timestamptz,
  expires_at      timestamptz,
  verified_by     uuid,
  verified_at     timestamptz,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired','rejected','revoked')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_credentials_vendor
  ON public.vendor_credentials(vendor_id, kind);
CREATE INDEX IF NOT EXISTS idx_vendor_credentials_expiry
  ON public.vendor_credentials(expires_at) WHERE status = 'verified';

ALTER TABLE public.vendor_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_cred_org_scope ON public.vendor_credentials
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='vendors') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.vendor_credentials
                 ADD CONSTRAINT vendor_cred_vendor_fk
                 FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.deliverable_acceptance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL,
  client_user_id  uuid,
  deliverable_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  signed_by       uuid,
  signed_at       timestamptz,
  signed_doc_id   uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deliverable_acceptance ENABLE ROW LEVEL SECURITY;
CREATE POLICY deliv_accept_org_scope ON public.deliverable_acceptance
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.proof_of_performance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sponsor_id      uuid REFERENCES public.sponsors(id) ON DELETE SET NULL,
  project_id      uuid,
  impressions     bigint,
  scans           bigint,
  interactions    bigint,
  asset_ids       uuid[] NOT NULL DEFAULT '{}'::uuid[],
  report_doc_id   uuid,
  generated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proof_of_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY pop_org_scope ON public.proof_of_performance
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TYPE tax_export_kind AS ENUM ('1099_nec','1099_misc','w2','foreign_1042','other');
CREATE TYPE tax_export_status AS ENUM ('draft','generated','filed','correction','voided');

CREATE TABLE IF NOT EXISTS public.tax_exports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid,
  tax_year        integer NOT NULL,
  kind            tax_export_kind NOT NULL,
  recipient_type  text NOT NULL CHECK (recipient_type IN ('person','org')),
  recipient_user_id uuid,
  recipient_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  recipient_vendor_id uuid,
  amount          numeric(14,2) NOT NULL DEFAULT 0,
  status          tax_export_status NOT NULL DEFAULT 'draft',
  generated_at    timestamptz,
  filed_at        timestamptz,
  correction_of   uuid REFERENCES public.tax_exports(id) ON DELETE SET NULL,
  doc_id          uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_exports_year_kind
  ON public.tax_exports(tax_year, kind, status);

ALTER TABLE public.tax_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_exports_org_scope ON public.tax_exports
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ============================================================
-- End of 00155
-- ============================================================
