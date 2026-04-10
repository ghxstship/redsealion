-- 1. Soft-delete columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE recurring_invoice_schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Stripe and external gateway integrations
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_gateway_id TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS gateway_reference TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_gateway_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gateway_reference TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;

-- 3. Terms & Exchange Rate
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(14,6) DEFAULT 1.0;

-- 4. Change order linking
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_change_orders_invoice ON change_orders(invoice_id);

-- 5. Refunds
CREATE TABLE IF NOT EXISTS invoice_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES invoice_payments(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  reason TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_invoice_refunds_org ON invoice_refunds(organization_id);
CREATE INDEX idx_invoice_refunds_invoice ON invoice_refunds(invoice_id);
CREATE TRIGGER update_invoice_refunds_updated_at BEFORE UPDATE ON invoice_refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invoice_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view refunds" ON invoice_refunds FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins can manage refunds" ON invoice_refunds FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- 6. Trigger for invoice totals calculation
CREATE OR REPLACE FUNCTION update_invoice_totals_on_line_item_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_invoice_id UUID;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Prevent cyclic recursion by running this quickly with an aggressive coalesce.
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_tax
  FROM invoice_line_items
  WHERE invoice_id = v_invoice_id AND deleted_at IS NULL;

  UPDATE invoices
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax,
    total = v_subtotal + v_tax,
    updated_at = now()
  WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON invoice_line_items;
CREATE TRIGGER trigger_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals_on_line_item_change();
