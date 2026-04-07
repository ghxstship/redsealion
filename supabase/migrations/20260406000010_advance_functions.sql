-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 10: Functions & Triggers
-- ═══════════════════════════════════════════════════════════

-- Recalculate advance totals on line item changes
CREATE FUNCTION recalculate_advance_totals() RETURNS TRIGGER AS $$
BEGIN
  UPDATE production_advances SET
    subtotal_cents = COALESCE((SELECT SUM(line_total_cents) FROM advance_line_items WHERE advance_id = COALESCE(NEW.advance_id, OLD.advance_id)), 0),
    line_item_count = (SELECT COUNT(*) FROM advance_line_items WHERE advance_id = COALESCE(NEW.advance_id, OLD.advance_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.advance_id, OLD.advance_id);
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_line_items_recalc
  AFTER INSERT OR UPDATE OR DELETE ON advance_line_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_advance_totals();

-- Auto-log status changes
CREATE FUNCTION log_advance_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO advance_status_history (advance_id, entity_type, previous_status, new_status, changed_by)
    VALUES (NEW.id, 'advance', OLD.status::TEXT, NEW.status::TEXT, auth.uid());
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_advance_status_log
  BEFORE UPDATE ON production_advances
  FOR EACH ROW EXECUTE FUNCTION log_advance_status_change();

-- Auto-log line item fulfillment changes
CREATE FUNCTION log_line_item_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status THEN
    INSERT INTO advance_status_history (advance_id, line_item_id, entity_type, previous_status, new_status, changed_by)
    VALUES (NEW.advance_id, NEW.id, 'line_item', OLD.fulfillment_status::TEXT, NEW.fulfillment_status::TEXT, auth.uid());
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_line_item_status_log
  BEFORE UPDATE ON advance_line_items
  FOR EACH ROW EXECUTE FUNCTION log_line_item_status_change();

-- Emit webhook events on status changes
CREATE FUNCTION emit_advance_webhook() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO advance_webhook_events (organization_id, event_type, entity_type, entity_id, payload)
    VALUES (NEW.organization_id, 'advance.' || NEW.status, 'advance', NEW.id,
      jsonb_build_object('advance_id', NEW.id, 'previous_status', OLD.status, 'new_status', NEW.status,
        'advance_number', NEW.advance_number, 'advance_mode', NEW.advance_mode));
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_advance_webhook
  AFTER UPDATE ON production_advances
  FOR EACH ROW EXECUTE FUNCTION emit_advance_webhook();

-- Optimistic locking on versioned entities
CREATE FUNCTION advance_check_version() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version != OLD.version + 1 THEN
    RAISE EXCEPTION 'Version conflict: expected %, got %', OLD.version + 1, NEW.version
      USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Apply to versioned catalog tables
CREATE TRIGGER trg_catalog_items_version BEFORE UPDATE ON advance_catalog_items
  FOR EACH ROW EXECUTE FUNCTION advance_check_version();
CREATE TRIGGER trg_catalog_variants_version BEFORE UPDATE ON advance_catalog_variants
  FOR EACH ROW EXECUTE FUNCTION advance_check_version();

-- updated_at auto-touch triggers
CREATE TRIGGER trg_advance_category_groups_updated BEFORE UPDATE ON advance_category_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_categories_updated BEFORE UPDATE ON advance_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_catalog_items_updated BEFORE UPDATE ON advance_catalog_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_catalog_variants_updated BEFORE UPDATE ON advance_catalog_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_modifier_lists_updated BEFORE UPDATE ON advance_modifier_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_production_advances_updated BEFORE UPDATE ON production_advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_collaborators_updated BEFORE UPDATE ON advance_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_line_items_updated BEFORE UPDATE ON advance_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advance_templates_updated BEFORE UPDATE ON advance_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
