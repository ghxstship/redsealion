-- Sprint 3: Invoice payments and email notifications

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  received_date DATE NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);

CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_notifications_org ON email_notifications(organization_id);

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view payments" ON invoice_payments FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins can manage payments" ON invoice_payments FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "Org members can view notifications" ON email_notifications FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can create notifications" ON email_notifications FOR INSERT WITH CHECK (organization_id = auth_user_org_id() AND is_producer_role());
