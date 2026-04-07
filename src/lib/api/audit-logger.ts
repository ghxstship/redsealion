import { createClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';

type LogAuditActionParams = {
  orgId: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, any>;
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
      console.error('Failed to write audit log:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Audit logger threw exception:', err);
    return false;
  }
}
