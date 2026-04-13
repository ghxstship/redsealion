/**
 * RBAC — Audit Logging
 *
 * Server-side structured audit logging for RBAC events.
 * All identity and security events should flow through this module.
 */
import { createClient } from '@/lib/supabase/server';
import type { AuditActorType } from '@/types/rbac';

interface AuditLogParams {
  organizationId: string | null;
  actorId: string | null;
  actorType: AuditActorType;
  impersonatedBy?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Write an audit log entry. Fire-and-forget by default.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  const supabase = await createClient();

  await supabase.from('audit_log').insert({
    organization_id: params.organizationId,
    user_id: params.actorId,
    actor_type: params.actorType,
    impersonated_by: params.impersonatedBy ?? null,
    action: params.action,
    entity_type: params.resourceType,
    resource_type: params.resourceType,
    entity_id: params.resourceId,
    changes: params.changes ?? {},
    metadata: params.metadata ?? {},
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });
}

/**
 * Extract IP address from request headers.
 */
export function extractIpAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip') ?? null;
}

/**
 * Extract user agent from request headers.
 */
export function extractUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}
