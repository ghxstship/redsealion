/**
 * Pre-built automation templates for common production workflows.
 *
 * Each template defines a trigger type, optional conditions, and an action
 * with default configuration that users can customize.
 *
 * @module lib/automations/templates
 */

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'tpl_proposal_approved_tasks',
    name: 'Create tasks on proposal approval',
    description: 'Automatically generate project tasks from the proposal template when a proposal is approved.',
    category: 'Project Setup',
    trigger_type: 'proposal_approved',
    trigger_config: { conditions: [] },
    action_type: 'create_task',
    action_config: {
      title: 'Kickoff: {{proposal_name}}',
      description: 'Project kickoff task auto-created from approved proposal.',
      priority: 'high',
    },
  },
  {
    id: 'tpl_milestone_invoice',
    name: 'Generate invoice on milestone completion',
    description: 'Create a deposit or balance invoice when a project milestone is completed.',
    category: 'Finance',
    trigger_type: 'milestone_completed',
    trigger_config: { conditions: [] },
    action_type: 'create_invoice',
    action_config: {
      invoice_type: 'balance',
    },
  },
  {
    id: 'tpl_invoice_overdue_reminder',
    name: 'Send reminder on overdue invoice',
    description: 'Automatically send an email reminder to the client when an invoice becomes overdue.',
    category: 'Finance',
    trigger_type: 'invoice_overdue',
    trigger_config: { conditions: [] },
    action_type: 'send_email',
    action_config: {
      subject: 'Payment Reminder: Invoice {{invoice_number}}',
      body: 'Hi, this is a friendly reminder that invoice {{invoice_number}} for {{total}} is now overdue. Please arrange payment at your earliest convenience.',
    },
  },
  {
    id: 'tpl_task_assigned_notify',
    name: 'Notify assignee via Slack',
    description: 'Send a Slack notification when a task is assigned to a team member.',
    category: 'Notifications',
    trigger_type: 'task_assigned',
    trigger_config: { conditions: [] },
    action_type: 'send_slack',
    action_config: {
      message: 'New task assigned: "{{title}}" -- assigned to you by {{actor_name}}',
    },
  },
  {
    id: 'tpl_deal_stage_sync',
    name: 'Update proposal on deal stage change',
    description: 'When a deal moves to a new stage, update the linked proposal status accordingly.',
    category: 'Sales',
    trigger_type: 'deal_stage_change',
    trigger_config: {
      conditions: [{ field: 'new_stage', operator: 'equals', value: 'contract_signed' }],
    },
    action_type: 'update_status',
    action_config: {
      entity_type: 'proposals',
      new_status: 'approved',
    },
  },
  {
    id: 'tpl_expense_approval',
    name: 'Request approval on expense submission',
    description: 'Automatically notify managers when a team member submits an expense report over a threshold.',
    category: 'Finance',
    trigger_type: 'expense_submitted',
    trigger_config: {
      conditions: [{ field: 'amount', operator: 'greater_than', value: 100 }],
    },
    action_type: 'send_email',
    action_config: {
      subject: 'Expense Approval Required: {{description}} (${{amount}})',
      body: '{{submitter_name}} submitted an expense of ${{amount}} for "{{description}}". Please review and approve in FlyteDeck.',
    },
  },
  {
    id: 'tpl_weekly_timesheet_reminder',
    name: 'Weekly timesheet reminder',
    description: 'Send a reminder email to team members who haven\'t submitted their timesheet by Friday.',
    category: 'Time Tracking',
    trigger_type: 'timesheet_submitted',
    trigger_config: { conditions: [] },
    action_type: 'send_email',
    action_config: {
      subject: 'Timesheet Reminder: Please submit your hours',
      body: 'Hi {{user_name}}, please don\'t forget to submit your timesheet for this week.',
    },
  },
  {
    id: 'tpl_portal_view_notify',
    name: 'Notify when client views proposal',
    description: 'Alert the sales owner when a client first views their proposal in the portal.',
    category: 'Sales',
    trigger_type: 'client_portal_viewed',
    trigger_config: { conditions: [] },
    action_type: 'send_slack',
    action_config: {
      message: '{{client_name}} just viewed proposal "{{proposal_name}}" in the client portal.',
    },
  },
  {
    id: 'tpl_deal_inactivity_followup',
    name: 'Auto-follow-up on deal inactivity',
    description: 'Send a follow-up email when a deal has had no activity for 7+ days.',
    category: 'Sales',
    trigger_type: 'deal_inactive',
    trigger_config: {
      conditions: [{ field: 'days_inactive', operator: 'greater_than', value: 7 }],
    },
    action_type: 'send_email',
    action_config: {
      subject: 'Following up on {{deal_title}}',
      body: 'Hi, I wanted to check in on {{deal_title}}. Is there anything I can help with to move things forward?',
    },
  },
  {
    id: 'tpl_lead_assignment_roundrobin',
    name: 'Round-robin lead assignment',
    description: 'Automatically assign new leads to team members in a round-robin rotation.',
    category: 'Sales',
    trigger_type: 'lead_created',
    trigger_config: { conditions: [] },
    action_type: 'assign_owner',
    action_config: {
      strategy: 'round_robin',
      team_filter: 'sales',
    },
  },
  {
    id: 'tpl_lead_score_notify',
    name: 'Notify on high-scoring lead',
    description: 'Send a Slack notification when a new lead scores 70+ (hot lead).',
    category: 'Sales',
    trigger_type: 'lead_created',
    trigger_config: {
      conditions: [{ field: 'lead_score', operator: 'greater_than', value: 70 }],
    },
    action_type: 'send_slack',
    action_config: {
      message: '🔥 Hot lead! "{{contact_name}}" from {{company_name}} scored {{lead_score}}/100.',
    },
  },
  {
    id: 'tpl_deal_close_approaching',
    name: 'Deal close date approaching',
    description: 'Send a reminder when a deal\'s expected close date is 3 days away.',
    category: 'Sales',
    trigger_type: 'deal_close_approaching',
    trigger_config: {
      conditions: [{ field: 'days_until_close', operator: 'equals', value: 3 }],
    },
    action_type: 'send_email',
    action_config: {
      subject: 'Reminder: {{deal_title}} closing in 3 days',
      body: 'The expected close date for {{deal_title}} ({{deal_value}}) is approaching. Please ensure all requirements are met.',
    },
  },
];

/**
 * Get templates filtered by category.
 */
function getTemplatesByCategory(category?: string): AutomationTemplate[] {
  if (!category) return AUTOMATION_TEMPLATES;
  return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique template categories.
 */
export function getTemplateCategories(): string[] {
  return [...new Set(AUTOMATION_TEMPLATES.map((t) => t.category))];
}
