-- ---------------------------------------------------------------------------
-- Migration: 00062_audit_logs
-- Purpose: Create an immutable audit log for SOC2 compliance.
-- ---------------------------------------------------------------------------

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by organization and chronological order (critical for log views)
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Strict RLS Policies for Immutability
-- ---------------------------------------------------------------------------

-- 1. Read access: Only allowed for Org Admins or Super Admins
--    Uses organization_memberships + roles (SSOT after 00033_normalize_ssot)
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.organization_id = audit_logs.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.hierarchy_level <= 20
  )
);

-- 2. Insert access: Authenticated users can insert logs for their own org.
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_id = audit_logs.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
  )
);

-- EXPLICIT OMISSION: NO UPDATE OR DELETE POLICIES
-- This enforces database-level append-only immutability.
