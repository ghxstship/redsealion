/**
 * Unified automation trigger and action type constants.
 *
 * Single Source of Truth (SSOT) — imported by UI selectors, trigger engine,
 * action executors, and API routes.
 *
 * @module lib/automations/constants
 */

// ---------------------------------------------------------------------------
// Trigger types
// ---------------------------------------------------------------------------

export const TRIGGER_TYPES = [
  { value: 'proposal_status_change', label: 'Proposal Status Change', description: 'Fires when a proposal status changes' },
  { value: 'proposal_approved', label: 'Proposal Approved', description: 'Fires when a proposal is approved by the client' },
  { value: 'proposal_sent', label: 'Proposal Sent', description: 'Fires when a proposal is sent to the client' },
  { value: 'proposal_viewed', label: 'Proposal Viewed', description: 'Fires when a client views a proposal in the portal' },
  { value: 'proposal_follow_up', label: 'Proposal Follow-Up', description: 'Fires when a sent proposal has no response after a delay' },
  { value: 'proposal_viewed_no_action', label: 'Proposal Viewed (No Action)', description: 'Fires when a proposal is viewed but not approved' },
  { value: 'deal_stage_change', label: 'Deal Stage Change', description: 'Fires when a deal moves to a new stage' },
  { value: 'deal_close_approaching', label: 'Deal Close Approaching', description: 'Fires when a deal is nearing its expected close date' },
  { value: 'invoice_created', label: 'Invoice Created', description: 'Fires when a new invoice is generated' },
  { value: 'invoice_sent', label: 'Invoice Sent', description: 'Fires when an invoice is sent to a client' },
  { value: 'invoice_paid', label: 'Invoice Paid', description: 'Fires when an invoice is fully paid' },
  { value: 'invoice_overdue', label: 'Invoice Overdue', description: 'Fires when an invoice passes its due date' },
  { value: 'milestone_completed', label: 'Milestone Completed', description: 'Fires when a milestone gate is completed' },
  { value: 'client_created', label: 'Client Created', description: 'Fires when a new client is added' },
  { value: 'client_portal_viewed', label: 'Client Portal Viewed', description: 'Fires when a client accesses the portal' },
  { value: 'task_created', label: 'Task Created', description: 'Fires when a new task is created' },
  { value: 'task_status_change', label: 'Task Status Change', description: 'Fires when a task status changes' },
  { value: 'task_assigned', label: 'Task Assigned', description: 'Fires when a task is assigned to a user' },
  { value: 'task_overdue', label: 'Task Overdue', description: 'Fires when a task passes its due date' },
  { value: 'expense_submitted', label: 'Expense Submitted', description: 'Fires when an expense report is submitted' },
  { value: 'timesheet_submitted', label: 'Timesheet Submitted', description: 'Fires when a timesheet is submitted' },
  { value: 'comment_added', label: 'Comment Added', description: 'Fires when a comment is posted' },
  { value: 'mention_received', label: 'Mention Received', description: 'Fires when a user is mentioned' },
  { value: 'lead_created', label: 'Lead Created', description: 'Fires when a new lead is captured' },
  { value: 'schedule', label: 'Scheduled', description: 'Fires on a recurring schedule (cron)' },
  { value: 'webhook_received', label: 'Webhook Received', description: 'Fires when a webhook event is received' },
] as const;

export type AutomationTriggerType = (typeof TRIGGER_TYPES)[number]['value'];

const TRIGGER_TYPE_VALUES: string[] = TRIGGER_TYPES.map((t) => t.value);

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email', description: 'Send an email notification' },
  { value: 'send_follow_up_email', label: 'Send Follow-Up Email', description: 'Send a proposal follow-up nudge to the client' },
  { value: 'send_review_request', label: 'Request Review', description: 'Ask the client for a review after project completion' },
  { value: 'send_slack', label: 'Send Slack Message', description: 'Post a message to a Slack channel' },
  { value: 'create_invoice', label: 'Create Invoice', description: 'Auto-generate an invoice' },
  { value: 'create_task', label: 'Create Task', description: 'Create a task' },
  { value: 'update_deal_stage', label: 'Update Deal Stage', description: 'Move a deal to a different stage' },
  { value: 'update_status', label: 'Update Status', description: 'Change the status of an entity' },
  { value: 'assign_user', label: 'Assign User', description: 'Assign a user to a task or entity' },
  { value: 'assign_owner', label: 'Assign Owner', description: 'Auto-assign an owner via strategy (e.g. round-robin)' },
  { value: 'add_tag', label: 'Add Tag', description: 'Apply a tag to an entity' },
  { value: 'sync_crm', label: 'Sync to CRM', description: 'Push data to connected CRM' },
  { value: 'webhook', label: 'Call Webhook', description: 'Send data to an external URL' },
  { value: 'create_calendar_event', label: 'Create Calendar Event', description: 'Add event to connected calendar' },
] as const;

export type AutomationActionType = (typeof ACTION_TYPES)[number]['value'];

const ACTION_TYPE_VALUES: string[] = ACTION_TYPES.map((a) => a.value);
