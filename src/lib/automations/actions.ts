/**
 * Automation action executors registry.
 *
 * Each action type has a dedicated executor that receives the action config
 * and trigger payload, then performs the side effect.
 *
 * @module lib/automations/actions
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { AutomationActionType } from './constants';

const log = createLogger('automations');

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

type ActionType = AutomationActionType;

type ActionExecutor = (
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
) => Promise<void>;

const actionRegistry: Record<string, ActionExecutor> = {
  send_email: executeSendEmail,
  send_follow_up_email: executeSendFollowUpEmail,
  send_review_request: executeSendReviewRequest,
  send_slack: executeSendSlack,
  create_task: executeCreateTask,
  create_invoice: executeCreateInvoice,
  update_status: executeUpdateStatus,
  update_deal_stage: executeUpdateDealStage,
  assign_user: executeAssignUser,
  assign_owner: executeAssignOwner,
  add_tag: executeAddTag,
  sync_crm: executeSyncCrm,
  webhook: executeWebhook,
  create_calendar_event: executeCreateCalendarEvent,
};

/**
 * Execute an automation action by type.
 */
export async function executeAction(
  actionType: string,
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
  automationId: string,
): Promise<void> {
  const executor = actionRegistry[actionType];
  if (!executor) {
    log.warn(`Unknown action type: ${actionType}`, { automationId });
    return;
  }

  await executor(config, payload);
}

// ---------------------------------------------------------------------------
// Individual action implementations
// ---------------------------------------------------------------------------

async function executeSendEmail(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const orgId = payload.org_id as string;

  await supabase.from('email_notifications').insert({
    organization_id: orgId,
    recipient_email: (config.to_email ?? config.to) as string ?? '',
    recipient_name: (config.to_name as string) ?? null,
    subject: interpolateTemplate((config.subject as string) ?? '', payload),
    body: interpolateTemplate((config.body as string) ?? '', payload),
    type: 'automation',
    related_entity_type: (payload.entity_type as string) ?? null,
    related_entity_id: (payload.entity_id as string) ?? null,
  });
}

async function executeSendFollowUpEmail(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const orgId = payload.org_id as string;
  const template = (config.template as string) ?? 'gentle_reminder';

  const subjects: Record<string, string> = {
    gentle_reminder: 'Just checking in on {{proposal_name}}',
    value_highlight: 'Quick note about {{proposal_name}}',
    urgency_close: 'Final opportunity: {{proposal_name}}',
  };

  const subject = template === 'custom'
    ? interpolateTemplate((config.subject as string) ?? '', payload)
    : interpolateTemplate(subjects[template] ?? subjects.gentle_reminder, payload);

  await supabase.from('email_notifications').insert({
    organization_id: orgId,
    recipient_email: (payload.client_email as string) ?? '',
    subject,
    body: interpolateTemplate((config.body as string) ?? `Following up on your proposal.`, payload),
    type: 'automation_follow_up',
    related_entity_type: 'proposal',
    related_entity_id: (payload.proposal_id as string) ?? null,
  });
}

async function executeSendReviewRequest(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const orgId = payload.org_id as string;
  const reviewUrl = (config.reviewUrl as string) ?? '';

  await supabase.from('email_notifications').insert({
    organization_id: orgId,
    recipient_email: (payload.client_email as string) ?? '',
    subject: interpolateTemplate('We\'d love your feedback on {{proposal_name}}', payload),
    body: interpolateTemplate(
      `Thank you for working with us! We'd appreciate a review: ${reviewUrl}`,
      payload,
    ),
    type: 'automation_review_request',
    related_entity_type: 'proposal',
    related_entity_id: (payload.proposal_id as string) ?? null,
  });
}

async function executeSendSlack(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const webhookUrl = config.webhook_url as string;
  if (!webhookUrl) return;

  const message = interpolateTemplate((config.message as string) ?? '', payload);

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  }).catch(() => {});
}

async function executeCreateTask(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const orgId = payload.org_id as string;

  await supabase.from('tasks').insert({
    organization_id: orgId,
    title: interpolateTemplate((config.title as string) ?? 'New Task', payload),
    description: interpolateTemplate((config.description as string) ?? '', payload),
    status: (config.status as string) ?? 'todo',
    priority: (config.priority as string) ?? 'medium',
    assignee_id: (config.assignee_id as string) ?? null,
    proposal_id: (payload.proposal_id as string) ?? null,
    due_date: (config.due_date as string) ?? null,
    created_by: (payload.actor_id as string) ?? orgId,
    sort_order: 0,
  });
}

async function executeCreateInvoice(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const orgId = payload.org_id as string;

  await supabase.from('invoices').insert({
    organization_id: orgId,
    proposal_id: (payload.proposal_id as string) ?? null,
    client_id: (payload.client_id as string) ?? '',
    invoice_number: `INV-${Date.now()}`,
    type: (config.invoice_type as string) ?? 'deposit',
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    subtotal: (config.amount as number) ?? 0,
    tax_amount: 0,
    total: (config.amount as number) ?? 0,
    amount_paid: 0,
    currency: 'USD',
  });
}

async function executeUpdateStatus(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const entityType = (config.entity_type as string) ?? 'tasks';
  const entityId = (config.entity_id as string) ?? (payload.entity_id as string);
  const newStatus = config.new_status as string;

  if (!entityId || !newStatus) return;

  await supabase
    .from(entityType)
    .update({ status: newStatus })
    .eq('id', entityId);
}

async function executeUpdateDealStage(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const dealId = (config.deal_id as string) ?? (payload.deal_id as string);
  const newStage = (config.new_stage ?? config.stage) as string;

  if (!dealId || !newStage) return;

  await supabase
    .from('deals')
    .update({ stage: newStage })
    .eq('id', dealId);
}

async function executeAssignUser(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const entityId = (config.entity_id as string) ?? (payload.task_id as string);
  const assigneeId = config.assignee_id as string;

  if (!entityId || !assigneeId) return;

  await supabase
    .from('tasks')
    .update({ assignee_id: assigneeId })
    .eq('id', entityId);
}

async function executeAssignOwner(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const entityId = (payload.entity_id as string) ?? (payload.lead_id as string);
  const entityType = (payload.entity_type as string) || 'leads';
  const orgId = payload.org_id as string;
  const strategy = (config.strategy as string) ?? 'round_robin';

  if (!entityId || !orgId || entityType !== 'leads') return; // currently only supports leads

  log.info(`Assign owner requested via strategy: ${strategy}`, {
    entity_id: entityId,
    team_filter: config.team_filter,
  });

  if (strategy === 'round_robin') {
    // Find organization members
    const { data: members } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (!members || members.length === 0) return;

    const userIds = members.map(m => m.user_id).filter(Boolean) as string[];
    if (userIds.length === 0) return;

    // Load-balanced assignment: find member with fewest active leads
    const { data: leadCounts } = await supabase
      .from('leads')
      .select('assigned_to')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .not('status', 'in', '("converted","lost")')
      .in('assigned_to', userIds);

    const counts: Record<string, number> = {};
    for (const uid of userIds) counts[uid] = 0;
    
    if (leadCounts) {
      for (const row of leadCounts) {
        // Safe mapping in case the type isn't correctly inferred
        const assigned = (row as Record<string, unknown>).assigned_to as string | null;
        if (assigned && counts[assigned] !== undefined) {
          counts[assigned]++;
        }
      }
    }

    let selectedUserId = userIds[0];
    let minCount = Infinity;
    for (const uid of userIds) {
      if (counts[uid] < minCount) {
        minCount = counts[uid];
        selectedUserId = uid;
      }
    }

    await supabase
      .from('leads')
      .update({ assigned_to: selectedUserId })
      .eq('id', entityId);

    log.info(`Assigned lead to user via round_robin`, { entityId, selectedUserId });
  }
}

async function executeAddTag(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const tag = config.tag as string;
  const entityType = (config.entity_type as string) ?? 'proposals';
  const entityId = (config.entity_id as string) ?? (payload.entity_id as string);

  if (!tag || !entityId) return;

  // Only support tables that have a `tags` JSONB column
  if (entityType !== 'proposals' && entityType !== 'tasks') return;

  // Read current tags
  const { data: existing } = await supabase
    .from(entityType)
    .select('tags')
    .eq('id', entityId)
    .single();

  const currentTags: string[] = Array.isArray(existing?.tags) ? (existing.tags as string[]) : [];

  // Append only if not already present
  if (currentTags.includes(tag)) return;

  await supabase
    .from(entityType)
    .update({ tags: [...currentTags, tag] })
    .eq('id', entityId);
}

async function executeSyncCrm(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  // CRM sync is a stub — logs the intent for future integration
  log.info('CRM sync requested', {
    crm_platform: config.platform,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
  });
}

async function executeWebhook(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = config.url as string;
  if (!url) return;

  await fetch(url, {
    method: (config.method as string) ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.headers as Record<string, string> ?? {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

async function executeCreateCalendarEvent(
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const orgId = payload.org_id as string;

  await supabase.from('events').insert({
    organization_id: orgId,
    title: interpolateTemplate((config.title as string) ?? 'New Event', payload),
    description: interpolateTemplate((config.description as string) ?? '', payload),
    start_time: (config.start_time as string) ?? new Date().toISOString(),
    end_time: (config.end_time as string) ?? new Date(Date.now() + 3600_000).toISOString(),
    event_type: (config.event_type as string) ?? 'automation',
  }).then(() => {}, () => {
    // calendar_events table may not exist yet — log and continue
    log.warn('Failed to create calendar event via automation', { orgId });
  });
}

// ---------------------------------------------------------------------------
// Template interpolation
// ---------------------------------------------------------------------------

/**
 * Replace `{{key}}` and `{key}` placeholders in a template string with values
 * from the payload. Supports both single-brace and double-brace syntax.
 */
function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const val = data[key];
      return val != null ? String(val) : '';
    })
    .replace(/\{(\w+)\}/g, (_, key: string) => {
      const val = data[key];
      return val != null ? String(val) : '';
    });
}
