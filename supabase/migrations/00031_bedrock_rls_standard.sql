-- ============================================================
-- BEDROCK M-008: RLS Pattern Standardization
-- Risk: MODERATE — DROP/CREATE POLICY
-- Converts Pattern B (subquery) → Pattern A (auth_user_org_id())
-- Rollback: Reverse each policy to subquery pattern
-- ============================================================

-- crew_profiles: Pattern B → Pattern A
DROP POLICY IF EXISTS "crew_profiles_org_access" ON public.crew_profiles;
CREATE POLICY "crew_profiles_org_read" ON public.crew_profiles
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "crew_profiles_org_write" ON public.crew_profiles
  FOR ALL USING (organization_id = auth_user_org_id());

-- crew_availability: Pattern B → Pattern A
DROP POLICY IF EXISTS "crew_availability_org_access" ON public.crew_availability;
CREATE POLICY "crew_availability_org_read" ON public.crew_availability
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "crew_availability_org_write" ON public.crew_availability
  FOR ALL USING (organization_id = auth_user_org_id());

-- crew_bookings: Pattern B → Pattern A
DROP POLICY IF EXISTS "crew_bookings_org_access" ON public.crew_bookings;
CREATE POLICY "crew_bookings_org_read" ON public.crew_bookings
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "crew_bookings_org_write" ON public.crew_bookings
  FOR ALL USING (organization_id = auth_user_org_id());

-- equipment_bundles: Pattern B → Pattern A
DROP POLICY IF EXISTS "equipment_bundles_org_access" ON public.equipment_bundles;
CREATE POLICY "equipment_bundles_org_read" ON public.equipment_bundles
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "equipment_bundles_org_write" ON public.equipment_bundles
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- equipment_reservations: Pattern B → Pattern A
DROP POLICY IF EXISTS "equipment_reservations_org_access" ON public.equipment_reservations;
CREATE POLICY "equipment_reservations_org_read" ON public.equipment_reservations
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "equipment_reservations_org_write" ON public.equipment_reservations
  FOR ALL USING (organization_id = auth_user_org_id());

-- maintenance_records: Pattern B → Pattern A
DROP POLICY IF EXISTS "maintenance_records_org_access" ON public.maintenance_records;
CREATE POLICY "maintenance_records_org_read" ON public.maintenance_records
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "maintenance_records_org_write" ON public.maintenance_records
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- esignature_requests: Pattern B → Pattern A
DROP POLICY IF EXISTS "esignature_requests_org_access" ON public.esignature_requests;
CREATE POLICY "esignature_requests_org_read" ON public.esignature_requests
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "esignature_requests_org_write" ON public.esignature_requests
  FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

-- shifts: Pattern B → Pattern A
DROP POLICY IF EXISTS "shifts_org_access" ON public.shifts;
CREATE POLICY "shifts_org_read" ON public.shifts
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "shifts_org_write" ON public.shifts
  FOR ALL USING (organization_id = auth_user_org_id());

-- leads: Pattern B → Pattern A
DROP POLICY IF EXISTS "leads_org_access" ON public.leads;
CREATE POLICY "leads_org_read" ON public.leads
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "leads_org_write" ON public.leads
  FOR ALL USING (organization_id = auth_user_org_id());

-- lead_forms: Pattern B → Pattern A
DROP POLICY IF EXISTS "lead_forms_org_access" ON public.lead_forms;
CREATE POLICY "lead_forms_org_read" ON public.lead_forms
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "lead_forms_org_write" ON public.lead_forms
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- payment_links: Pattern B → Pattern A
DROP POLICY IF EXISTS "payment_links_org_access" ON public.payment_links;
CREATE POLICY "payment_links_org_read" ON public.payment_links
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "payment_links_org_write" ON public.payment_links
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- onboarding_documents: Pattern B → Pattern A
DROP POLICY IF EXISTS "onboarding_documents_org_access" ON public.onboarding_documents;
CREATE POLICY "onboarding_documents_org_read" ON public.onboarding_documents
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "onboarding_documents_org_write" ON public.onboarding_documents
  FOR ALL USING (organization_id = auth_user_org_id());

-- warehouse_transfers: Pattern B → Pattern A
DROP POLICY IF EXISTS "warehouse_transfers_org_access" ON public.warehouse_transfers;
CREATE POLICY "warehouse_transfers_org_read" ON public.warehouse_transfers
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "warehouse_transfers_org_write" ON public.warehouse_transfers
  FOR ALL USING (organization_id = auth_user_org_id());

-- api_keys: Pattern B → Pattern A (with role checks preserved)
DROP POLICY IF EXISTS "api_keys_select" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update" ON public.api_keys;
CREATE POLICY "api_keys_read" ON public.api_keys
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "api_keys_write" ON public.api_keys
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- tags: Pattern B → Pattern A
DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
DROP POLICY IF EXISTS "tags_update" ON public.tags;
DROP POLICY IF EXISTS "tags_delete" ON public.tags;
CREATE POLICY "tags_read" ON public.tags
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "tags_write" ON public.tags
  FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

-- email_templates: Pattern B → Pattern A
DROP POLICY IF EXISTS "email_templates_select" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_insert" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_update" ON public.email_templates;
CREATE POLICY "email_templates_read" ON public.email_templates
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "email_templates_write" ON public.email_templates
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- document_defaults: Pattern B → Pattern A
DROP POLICY IF EXISTS "document_defaults_select" ON public.document_defaults;
DROP POLICY IF EXISTS "document_defaults_insert" ON public.document_defaults;
DROP POLICY IF EXISTS "document_defaults_update" ON public.document_defaults;
CREATE POLICY "document_defaults_read" ON public.document_defaults
  FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "document_defaults_write" ON public.document_defaults
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
