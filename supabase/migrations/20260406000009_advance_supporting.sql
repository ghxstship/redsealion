-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 9: Supporting Tables
-- Status History, Comments, Templates, Webhook Events
-- ═══════════════════════════════════════════════════════════

-- ═══ STATUS HISTORY (immutable audit) ═══
CREATE TABLE advance_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES production_advances(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES advance_line_items(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'advance',
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_status_history_advance ON advance_status_history(advance_id, created_at);

-- ═══ COMMENTS ═══
CREATE TABLE advance_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES production_advances(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES advance_line_items(id),
  user_id UUID REFERENCES users(id),
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  is_contributor_visible BOOLEAN DEFAULT true,
  mentioned_user_ids UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  parent_comment_id UUID REFERENCES advance_comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_advance ON advance_comments(advance_id, created_at);

-- ═══ TEMPLATES ═══
CREATE TABLE advance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  advance_type advance_type,
  advance_mode advance_mode DEFAULT 'internal',
  template_items JSONB NOT NULL DEFAULT '[]',
  collection_settings JSONB DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_org ON advance_templates(organization_id);

-- ═══ WEBHOOK EVENTS ═══
CREATE TABLE advance_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhook_unprocessed ON advance_webhook_events(organization_id, processed, created_at)
  WHERE NOT processed;
