/**
 * Audit log utility.
 *
 * Records organizational audit events for compliance and security tracking.
 * Called from API routes on create/update/delete operations.
 *
 * @module lib/audit
 */

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'invite'
  | 'revoke'
  | 'configure';

export type AuditEntityType =
  | 'proposal'
  | 'task'
  | 'invoice'
  | 'client'
  | 'deal'
  | 'expense'
  | 'budget'
  | 'time_entry'
  | 'user'
  | 'integration'
  | 'automation'
  | 'asset'
  | 'crew_booking'
  | 'equipment'
  | 'purchase_order'
  | 'settings'
  | 'api_key';

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

/**
 * Log an audit event. Fire-and-forget — failures are silently swallowed.
 */
export async function logAuditEvent(params: {
  orgId: string;
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('audit_log').insert({
      organization_id: params.orgId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    });
  } catch {
    // Audit logging must never block the operation
  }
}

/**
 * Extract IP and UA from a request for audit logging.
 */
export function extractRequestMeta(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null,
    userAgent: request.headers.get('user-agent') ?? null,
  };
}
