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
import type { AutomationTriggerType } from './constants';

// ---------------------------------------------------------------------------
// Event types — re-export from constants for backward compatibility
// ---------------------------------------------------------------------------

type AutomationEvent = AutomationTriggerType;

interface AutomationPayload {
  org_id: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Trigger matching
// ---------------------------------------------------------------------------

/**
 * Check all active automations for an organization against an incoming event.
 * Matched automations have their actions executed and tracked in automation_runs.
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
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error || !automations || automations.length === 0) return;

    for (const automation of automations) {
      const triggerConfig = (automation.trigger_config ?? {}) as Record<string, unknown>;
      const conditions = (triggerConfig.conditions ?? []) as Array<Record<string, unknown>>;

      // Evaluate conditions — if conditions are empty, the automation always fires
      if (conditions.length > 0 && !evaluateConditions(conditions, payload)) {
        continue;
      }

      // Rate limiting — check runs in the last hour
      const maxPerHour = (automation.max_runs_per_hour as number) ?? 100;
      const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
      const { count: recentRuns } = await supabase
        .from('automation_runs')
        .select('id', { count: 'exact', head: true })
        .eq('automation_id', automation.id)
        .gte('started_at', oneHourAgo);

      if ((recentRuns ?? 0) >= maxPerHour) continue;

      // Create initial run record with 'running' status
      const { data: run } = await supabase.from('automation_runs').insert({
        automation_id: automation.id,
        organization_id: payload.org_id,
        status: 'running',
        trigger_data: payload,
        started_at: new Date().toISOString(),
      }).select('id').single();

      // Execute the action and track result
      const actionConfig = (automation.action_config ?? {}) as Record<string, unknown>;
      try {
        await executeAction(
          automation.action_type as string,
          actionConfig,
          payload,
          automation.id as string,
        );

        // Mark run as completed
        if (run) {
          await supabase.from('automation_runs').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          }).eq('id', run.id);
        }
      } catch (err) {
        // Mark run as failed with error message
        if (run) {
          await supabase.from('automation_runs').update({
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown execution error',
            completed_at: new Date().toISOString(),
          }).eq('id', run.id);
        }
      }

      // Atomic run_count increment
      await supabase.rpc('increment_counter', {
        table_name: 'automations',
        row_id: automation.id,
        column_name: 'run_count',
      }).then(() => {}, () => {
        // Fallback if rpc doesn't exist — non-atomic but functional
        supabase
          .from('automations')
          .update({
            run_count: ((automation.run_count as number) ?? 0) + 1,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', automation.id)
          .then(() => {}, () => {});
      });

      // Also update last_run_at
      await supabase
        .from('automations')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', automation.id);
    }
  } catch {
    // Automation failures should never block the triggering operation
  }
}
