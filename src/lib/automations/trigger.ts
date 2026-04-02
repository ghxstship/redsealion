/**
 * Automation trigger stub.
 *
 * Called when task-related events occur (e.g. creation, status change).
 * Currently a no-op; replace with real automation logic when ready.
 */

export type AutomationEvent = 'task_created' | 'task_status_change';

export interface AutomationPayload {
  org_id: string;
  task_id: string;
  title: string;
  status?: string;
  old_status?: string;
  new_status?: string;
  assignee_id?: string | null;
}

export async function checkAutomationTriggers(
  event: AutomationEvent,
  payload: AutomationPayload,
): Promise<void> {
  // TODO: implement automation trigger logic
  if (process.env.NODE_ENV === 'development') {
    console.log(`[automations] trigger: ${event}`, payload);
  }
}
