/** Canonical integration platform definitions — single source of truth. */

export interface PlatformConfig {
  platform: string;
  displayName: string;
  description: string;
  category: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { platform: 'salesforce', displayName: 'Salesforce', description: 'Sync contacts, opportunities, and accounts with Salesforce CRM.', category: 'crm' },
  { platform: 'hubspot', displayName: 'HubSpot', description: 'Sync contacts, deals, and companies with HubSpot CRM.', category: 'crm' },
  { platform: 'pipedrive', displayName: 'Pipedrive', description: 'Sync contacts and deals with Pipedrive CRM.', category: 'crm' },
  { platform: 'quickbooks', displayName: 'QuickBooks', description: 'Sync invoices, payments, and customers with QuickBooks Online.', category: 'accounting' },
  { platform: 'xero', displayName: 'Xero', description: 'Sync invoices, payments, and contacts with Xero accounting.', category: 'accounting' },
  { platform: 'clickup', displayName: 'ClickUp', description: 'Create tasks and projects in ClickUp from proposals.', category: 'pm' },
  { platform: 'asana', displayName: 'Asana', description: 'Create tasks and projects in Asana from proposals.', category: 'pm' },
  { platform: 'monday', displayName: 'Monday.com', description: 'Create boards and items in Monday.com from proposals.', category: 'pm' },
  { platform: 'slack', displayName: 'Slack', description: 'Send notifications and updates to Slack channels.', category: 'messaging' },
  { platform: 'google_calendar', displayName: 'Google Calendar', description: 'Sync milestones and deadlines to Google Calendar.', category: 'calendar' },
  { platform: 'zapier', displayName: 'Zapier', description: 'Connect to thousands of apps via Zapier webhooks.', category: 'automation' },
];

/** Lookup map keyed by platform slug for detail pages. */
export const PLATFORM_MAP: Record<string, { displayName: string; category: string }> = Object.fromEntries(
  PLATFORMS.map((p) => [p.platform, { displayName: p.displayName, category: p.category }])
);

export const CATEGORY_LABELS: Record<string, string> = {
  crm: 'CRM',
  accounting: 'Accounting',
  pm: 'Project Management',
  messaging: 'Messaging',
  calendar: 'Calendar',
  automation: 'Automation',
};

/** Per-category field mapping definitions for the mapping editor. */
export const CATEGORY_FIELD_MAPPINGS: Record<string, { sourceFields: string[]; targetFields: string[] }> = {
  crm: {
    sourceFields: ['Contact Name', 'Email', 'Phone', 'Company', 'Title', 'Deal Value', 'Deal Stage'],
    targetFields: ['company_name', 'email', 'phone', 'industry', 'title', 'total_value', 'deal_stage'],
  },
  accounting: {
    sourceFields: ['Invoice Number', 'Amount', 'Due Date', 'Customer', 'Line Items', 'Tax', 'Payment Status'],
    targetFields: ['invoice_number', 'total', 'due_date', 'client_id', 'line_items', 'tax_amount', 'status'],
  },
  pm: {
    sourceFields: ['Task Name', 'Description', 'Assignee', 'Due Date', 'Priority', 'Status', 'Project'],
    targetFields: ['title', 'description', 'assigned_to', 'due_date', 'priority', 'status', 'project_id'],
  },
  messaging: {
    sourceFields: ['Channel', 'Message', 'Sender'],
    targetFields: ['channel_id', 'body', 'user_id'],
  },
  calendar: {
    sourceFields: ['Event Title', 'Start', 'End', 'Location', 'Description'],
    targetFields: ['name', 'start_date', 'end_date', 'location', 'description'],
  },
  automation: {
    sourceFields: ['Trigger Event', 'Payload'],
    targetFields: ['webhook_event', 'data'],
  },
};
