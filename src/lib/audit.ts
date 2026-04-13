/**
 * Application-Level Audit Logger
 *
 * Records organizational audit events for compliance and security tracking.
 * Called from API routes on create/update/delete operations.
 * Writes to the `audit_log` table (migration 00014).
 *
 * For RBAC identity/security audit events (SOC2 compliance),
 * use `@/lib/api/audit-logger` which writes to the `audit_logs` table.
 *
 * Both modules are intentional — they serve different compliance scopes:
 *   - `audit_log`  → app-level operations (create/update/delete entities)
 *   - `audit_logs` → identity/security (login, role changes, permission grants)
 *
 * @module lib/audit
 * @see {@link @/lib/api/audit-logger} for SOC2 compliance events
 */

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditAction =
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

type AuditEntityType =
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
async function logAuditEvent(params: {
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
function extractRequestMeta(request: Request): {
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

/**
 * Simplified audit helper for use in API routes that already have a client.
 * Fire-and-forget — failures are silently swallowed.
 */
export async function logAudit(
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: any,
): Promise<void> {
  try {
    const client = supabase ?? (await createClient());
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id ?? null;
    const { data: user } = userId
      ? await client.from('users').select('organization_id').eq('id', userId).single()
      : { data: null };
    const orgId = user?.organization_id ?? null;

    await client.from('audit_log').insert({
      organization_id: orgId,
      user_id: userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Audit logging must never block the operation
  }
}
