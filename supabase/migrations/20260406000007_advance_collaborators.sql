-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 7: Collaborators & Access Codes
-- ═══════════════════════════════════════════════════════════

-- Access codes created first (referenced by collaborators)
CREATE TABLE advance_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES production_advances(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  code_type access_code_type NOT NULL DEFAULT 'multi_use',
  collaborator_role collaborator_role NOT NULL DEFAULT 'contributor',

  -- Restrictions
  allowed_advance_types advance_type[],
  allowed_category_groups UUID[],
  allowed_domains TEXT[],
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,

  -- Validity
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Creator
  created_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(advance_id, code)
);

CREATE INDEX idx_access_codes_advance ON advance_access_codes(advance_id, is_active);
CREATE INDEX idx_access_codes_lookup ON advance_access_codes(code) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════
-- Collaborators — Who can participate in this advance
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES production_advances(id) ON DELETE CASCADE,

  -- The collaborator identity (one of these must be set)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT,

  -- Role and permissions
  collaborator_role collaborator_role NOT NULL DEFAULT 'contributor',

  -- Status
  invite_status invite_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Access tracking
  access_code_id UUID REFERENCES advance_access_codes(id),
  last_accessed_at TIMESTAMPTZ,

  -- Scoping
  allowed_advance_types advance_type[],
  allowed_category_groups UUID[],
  custom_instructions TEXT,

  -- Submission tracking
  submission_status TEXT DEFAULT 'not_started',
  submitted_at TIMESTAMPTZ,
  submission_notes TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(advance_id, user_id),
  UNIQUE(advance_id, organization_id),
  UNIQUE(advance_id, email)
);

CREATE INDEX idx_collaborators_advance ON advance_collaborators(advance_id);
CREATE INDEX idx_collaborators_user ON advance_collaborators(user_id);
CREATE INDEX idx_collaborators_org ON advance_collaborators(organization_id);
CREATE INDEX idx_collaborators_status ON advance_collaborators(advance_id, invite_status);
