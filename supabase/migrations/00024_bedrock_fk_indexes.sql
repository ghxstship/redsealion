-- ============================================================
-- BEDROCK M-001: Missing FK Indexes
-- Risk: LOW — Additive only, zero downtime
-- Rollback: DROP INDEX for each
-- ============================================================

-- High priority FK indexes (frequently JOINed)
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON public.proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_terms_doc ON public.proposals(terms_document_id);
CREATE INDEX IF NOT EXISTS idx_proposals_parent ON public.proposals(parent_proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_phase_template ON public.proposals(phase_template_id);
CREATE INDEX IF NOT EXISTS idx_proposals_pipeline ON public.proposals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_client ON public.deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON public.deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_deal ON public.leads(converted_to_deal_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id);

-- Medium priority FK indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_deliverable ON public.invoice_line_items(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_addon ON public.invoice_line_items(addon_id);
CREATE INDEX IF NOT EXISTS idx_assets_src_deliverable ON public.assets(source_deliverable_id);
CREATE INDEX IF NOT EXISTS idx_assets_src_addon ON public.assets(source_addon_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON public.activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.proposal_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploader ON public.file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_milestone_reqs_completer ON public.milestone_requirements(completed_by);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON public.credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_deal ON public.email_threads(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_client ON public.email_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_proposal ON public.change_orders(proposal_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_proposal ON public.time_entries(proposal_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_phase ON public.time_entries(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_proposal ON public.tasks(proposal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON public.tasks(phase_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_proposals_org_status ON public.proposals(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON public.invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_org_status ON public.tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_org_stage ON public.deals(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_time ON public.time_entries(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_entity ON public.audit_log(organization_id, entity_type, created_at DESC);

-- GIN indexes for JSONB query performance
CREATE INDEX IF NOT EXISTS idx_cfv_value_gin ON public.custom_field_values USING GIN(value);
CREATE INDEX IF NOT EXISTS idx_automations_trigger_gin ON public.automations USING GIN(trigger_config);
