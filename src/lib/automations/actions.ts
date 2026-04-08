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

const log = createLogger('automations');

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

export type ActionType =
  | 'send_email'
  | 'send_slack'
  | 'create_task'
  | 'create_invoice'
  | 'update_status'
  | 'assign_user'
  | 'add_tag'
  | 'webhook';

type ActionExecutor = (
  config: Record<string, unknown>,
  payload: Record<string, unknown>,
) => Promise<void>;

const actionRegistry: Record<string, ActionExecutor> = {
  send_email: executeSendEmail,
  send_slack: executeSendSlack,
  create_task: executeCreateTask,
  create_invoice: executeCreateInvoice,
  update_status: executeUpdateStatus,
  assign_user: executeAssignUser,
  add_tag: executeAddTag,
  webhook: executeWebhook,
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
    recipient_email: (config.to_email as string) ?? '',
    recipient_name: (config.to_name as string) ?? null,
    subject: interpolateTemplate((config.subject as string) ?? '', payload),
    body: interpolateTemplate((config.body as string) ?? '', payload),
    type: 'automation',
    related_entity_type: (payload.entity_type as string) ?? null,
    related_entity_id: (payload.entity_id as string) ?? null,
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

// ---------------------------------------------------------------------------
// Template interpolation
// ---------------------------------------------------------------------------

/**
 * Replace `{{key}}` placeholders in a template string with values from the payload.
 */
function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = data[key];
    return val != null ? String(val) : '';
  });
}
