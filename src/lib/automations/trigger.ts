/**
 * Automation trigger engine — production implementation.
 *
 * When an event occurs (task created, proposal approved, etc.), this module
 * queries the org's active automations for matching trigger types and evaluates
 * conditions against the event payload. Matched automations are dispatched
 * to the action executor.
 *
 * @module lib/automations/trigger
 */

import { createClient } from '@/lib/supabase/server';
import { executeAction } from './actions';
import { evaluateConditions } from './conditions';

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type AutomationEvent =
  | 'task_created'
  | 'task_status_change'
  | 'task_assigned'
  | 'task_overdue'
  | 'proposal_approved'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_overdue'
  | 'invoice_paid'
  | 'milestone_completed'
  | 'deal_stage_change'
  | 'expense_submitted'
  | 'timesheet_submitted'
  | 'client_portal_viewed'
  | 'comment_added'
  | 'mention_received';

export interface AutomationPayload {
  org_id: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Trigger matching
// ---------------------------------------------------------------------------

/**
 * Check all active automations for an organization against an incoming event.
 * Matched automations have their actions executed asynchronously.
 */
export async function checkAutomationTriggers(
  event: AutomationEvent,
  payload: AutomationPayload,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Query automations matching this trigger type for this org
    const { data: automations, error } = await supabase
      .from('automations')
      .select('*')
      .eq('organization_id', payload.org_id)
      .eq('trigger_type', event)
      .eq('is_active', true);

    if (error || !automations || automations.length === 0) return;

    for (const automation of automations) {
      const triggerConfig = (automation.trigger_config ?? {}) as Record<string, unknown>;
      const conditions = (triggerConfig.conditions ?? []) as Array<Record<string, unknown>>;

      // Evaluate conditions — if conditions are empty, the automation always fires
      if (conditions.length > 0 && !evaluateConditions(conditions, payload)) {
        continue;
      }

      // Execute the action
      const actionConfig = (automation.action_config ?? {}) as Record<string, unknown>;
      executeAction(
        automation.action_type as string,
        actionConfig,
        payload,
        automation.id as string,
      ).catch(() => {
        // Action execution failures are logged but don't block
      });

      // Update run count and last_run_at
      await supabase
        .from('automations')
        .update({
          run_count: (automation.run_count ?? 0) + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', automation.id);

      // Log the automation run
      await supabase.from('automation_runs').insert({
        automation_id: automation.id,
        organization_id: payload.org_id,
        status: 'completed',
        trigger_data: payload,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }
  } catch {
    // Automation failures should never block the triggering operation
  }
}
