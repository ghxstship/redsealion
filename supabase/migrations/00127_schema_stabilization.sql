-- Migration 00127: Schema Stabilization (FK Indexes, Missing Constraints, Normalization)

-- 1. Apply Missing High Priority FK Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_terms_doc ON proposals(terms_document_id);
CREATE INDEX IF NOT EXISTS idx_proposals_parent ON proposals(parent_proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_phase_template ON proposals(phase_template_id);
-- pipeline_id column was dropped in 00033, so we do not index it

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_deals_client ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_deal ON leads(converted_to_deal_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);

-- 2. Apply Missing Medium Priority FK Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_deliverable ON invoice_line_items(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_addon ON invoice_line_items(addon_id);
CREATE INDEX IF NOT EXISTS idx_assets_src_deliverable ON assets(source_deliverable_id);
CREATE INDEX IF NOT EXISTS idx_assets_src_addon ON assets(source_addon_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON proposal_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploader ON file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_milestone_reqs_completer ON milestone_requirements(completed_by);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_deal ON email_threads(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_client ON email_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_proposal ON change_orders(proposal_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_proposal ON time_entries(proposal_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_phase ON time_entries(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_proposal ON tasks(proposal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase_id);

-- 3. Pre-create 00021 columns for calendar_sync_configs if missing
ALTER TABLE calendar_sync_configs
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS calendar_id TEXT;

-- 4. Apply Missing Constraints
-- pipeline_id foreign key constraint removed as the column was dropped in 00033

-- 5. Normalize Portfolio Library
-- Step 5a: Convert `client_name` to `client_id` (leaving client_name for legacy/rollback)
ALTER TABLE portfolio_library
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Step 5b: Create junction table for tags
CREATE TABLE IF NOT EXISTS portfolio_library_tags (
  portfolio_id UUID NOT NULL REFERENCES portfolio_library(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (portfolio_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_tags_tag ON portfolio_library_tags(tag_id);

-- Enable RLS on the new table
ALTER TABLE portfolio_library_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portfolio tags in their org"
  ON portfolio_library_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_library
      WHERE portfolio_library.id = portfolio_library_tags.portfolio_id
      AND portfolio_library.organization_id IN (
        SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage portfolio tags in their org"
  ON portfolio_library_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_library
      WHERE portfolio_library.id = portfolio_library_tags.portfolio_id
      AND portfolio_library.organization_id IN (
        SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
      )
    )
  );
