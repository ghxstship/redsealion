/**
 * RBAC Audit Logger — SOC2 Compliance
 *
 * Writes to the `audit_logs` table (RBAC layer, migration 00062).
 * This is the identity/security audit trail used for SOC2 compliance.
 *
 * For application-level audit events (CRUD on proposals, tasks, etc.),
 * use `@/lib/audit` which writes to the `audit_log` table (migration 00014).
 *
 * Both modules are intentional — they serve different compliance scopes:
 *   - `audit_log`  → app-level operations (create/update/delete entities)
 *   - `audit_logs` → identity/security (login, role changes, permission grants)
 *
 * @module lib/api/audit-logger
 * @see {@link @/lib/audit} for application-level audit events
 */
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { createLogger } from '@/lib/logger';

const log = createLogger('audit');

type LogAuditActionParams = {
  orgId: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Log an action to the immutable audit_logs table for SOC2 compliance.
 * Uses the Supabase server client (inherits the caller's auth context or service role).
 */
export async function logAuditAction({
  orgId,
  action,
  entity,
  entityId,
  metadata = {},
}: LogAuditActionParams): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Attempt to parse IP from headers
    const reqHeaders = await headers();
    const ipAddress = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || 'unknown';

    // Get current authenticated user
    const { data: userData } = await supabase.auth.getUser();
    const actorId = userData?.user?.id || null;

    const { error } = await supabase.from('audit_logs').insert({
      organization_id: orgId,
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      metadata,
      ip_address: ipAddress,
    });

    if (error) {
      log.error('Failed to write audit log', { action, entity, entityId }, error);
      return false;
    }

    return true;
  } catch (err) {
    log.error('Audit logger threw exception', { action, entity, entityId }, err);
    return false;
  }
}
