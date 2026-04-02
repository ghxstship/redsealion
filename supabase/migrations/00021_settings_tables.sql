-- Settings infrastructure tables

-- User display preferences (theme, locale overrides)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  first_day_of_week INTEGER NOT NULL DEFAULT 0 CHECK (first_day_of_week BETWEEN 0 AND 6),
  number_format TEXT NOT NULL DEFAULT 'en-US',
  language TEXT NOT NULL DEFAULT 'en',
  default_calendar_view TEXT NOT NULL DEFAULT 'month' CHECK (default_calendar_view IN ('month', 'week', 'day')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Org-scoped API keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Org-scoped tags for categorization
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('equipment', 'crew', 'project', 'lead', 'client')),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, entity_type, name)
);

-- Org-customizable email notification templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, event_type)
);

-- Org-level document default text blocks
CREATE TABLE IF NOT EXISTS public.document_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('proposal', 'invoice', 'contract', 'sow', 'crew_call_sheet')),
  section TEXT NOT NULL CHECK (section IN ('terms_and_conditions', 'disclaimer', 'notes', 'scope_header', 'scope_footer', 'payment_instructions')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, document_type, section)
);

-- User-level calendar sync configuration
CREATE TABLE IF NOT EXISTS public.calendar_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  calendar_id TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id, provider)
);

-- Add localization fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '12h',
  ADD COLUMN IF NOT EXISTS first_day_of_week INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS number_format TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_configs ENABLE ROW LEVEL SECURITY;

-- user_preferences: users can manage their own
CREATE POLICY user_preferences_select ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_preferences_insert ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_preferences_update ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());

-- api_keys: org members can view, admins can manage
CREATE POLICY api_keys_select ON public.api_keys FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY api_keys_insert ON public.api_keys FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
);
CREATE POLICY api_keys_update ON public.api_keys FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
);

-- tags: org members can view, admins/PMs can manage
CREATE POLICY tags_select ON public.tags FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY tags_insert ON public.tags FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin', 'project_manager'))
);
CREATE POLICY tags_update ON public.tags FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin', 'project_manager'))
);
CREATE POLICY tags_delete ON public.tags FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin', 'project_manager'))
);

-- email_templates: org admins can manage
CREATE POLICY email_templates_select ON public.email_templates FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY email_templates_insert ON public.email_templates FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
);
CREATE POLICY email_templates_update ON public.email_templates FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
);

-- document_defaults: org admins can manage
CREATE POLICY document_defaults_select ON public.document_defaults FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY document_defaults_insert ON public.document_defaults FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
);
CREATE POLICY document_defaults_update ON public.document_defaults FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
);

-- calendar_sync_configs: users can manage their own
CREATE POLICY calendar_sync_select ON public.calendar_sync_configs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY calendar_sync_insert ON public.calendar_sync_configs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY calendar_sync_update ON public.calendar_sync_configs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY calendar_sync_delete ON public.calendar_sync_configs FOR DELETE USING (user_id = auth.uid());
