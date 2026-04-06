/**
 * Canonical field registry — Single Source of Truth for import/export field
 * definitions across all entity types. Drives:
 *   - Import column matching & validation
 *   - Export column selection & formatting
 *   - Template generation with example data
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EntityField {
  /** Database column key */
  key: string;
  /** Human-readable display label */
  label: string;
  /** Required for import (must be mapped) */
  required?: boolean;
  /** Data type — drives validation and formatting */
  type: 'text' | 'email' | 'number' | 'currency' | 'date' | 'enum' | 'phone' | 'url';
  /** For enum type — allowable values */
  enumValues?: string[];
  /** For text type — custom validation regex */
  pattern?: RegExp;
  /** Visible by default in export (defaults true) */
  defaultExportVisible?: boolean;
  /** Available for import mapping but excluded from exports */
  importOnly?: boolean;
  /** Available for export but excluded from import mapping */
  exportOnly?: boolean;
  /** Example value shown in templates */
  example?: string;
  /** Aliases for fuzzy column matching (common alternate names) */
  aliases?: string[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const ENTITY_FIELDS: Record<string, EntityField[]> = {
  leads: [
    { key: 'contact_first_name', label: 'First Name', required: true, type: 'text', example: 'Jane', aliases: ['first', 'fname', 'first_name', 'given_name'] },
    { key: 'contact_last_name', label: 'Last Name', required: true, type: 'text', example: 'Doe', aliases: ['last', 'lname', 'last_name', 'surname', 'family_name'] },
    { key: 'contact_email', label: 'Email', type: 'email', example: 'jane@example.com', aliases: ['email_address', 'e-mail'] },
    { key: 'company_name', label: 'Company', type: 'text', example: 'Acme Events', aliases: ['company', 'organization', 'org', 'business'] },
    { key: 'contact_phone', label: 'Phone', type: 'phone', example: '(555) 123-4567', aliases: ['phone_number', 'tel', 'telephone', 'mobile'] },
    { key: 'source', label: 'Source', type: 'enum', enumValues: ['referral', 'website', 'social_media', 'cold_outreach', 'trade_show', 'other'], example: 'referral', aliases: ['lead_source', 'origin'] },
    { key: 'estimated_budget', label: 'Budget', type: 'currency', example: '50000', aliases: ['budget', 'est_budget', 'estimated_value'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost', 'archived', 'disqualified'], example: 'new', defaultExportVisible: true },
    { key: 'created_at', label: 'Date', type: 'date', exportOnly: true, example: '2026-01-15' },
  ],

  clients: [
    { key: 'company_name', label: 'Company Name', required: true, type: 'text', example: 'Summit Productions', aliases: ['company', 'name', 'organization', 'org'] },
    { key: 'industry', label: 'Industry', type: 'text', example: 'Events & Entertainment', aliases: ['sector', 'vertical'] },
    { key: 'website', label: 'Website', type: 'url', example: 'https://summit.example.com', importOnly: true, aliases: ['url', 'web', 'site'] },
    { key: 'address', label: 'Address', type: 'text', example: '123 Main St, NYC', importOnly: true, aliases: ['location', 'hq'] },
    { key: 'tags', label: 'Tags', type: 'text', example: 'VIP, Returning', exportOnly: true },
    { key: 'proposals', label: 'Proposals', type: 'number', exportOnly: true, example: '3' },
    { key: 'total_value', label: 'Total Value', type: 'currency', exportOnly: true, example: '150000' },
    { key: 'last_activity', label: 'Last Activity', type: 'date', exportOnly: true, example: '2026-03-20' },
  ],

  people: [
    { key: 'full_name', label: 'Full Name', required: true, type: 'text', example: 'Alex Rivera', aliases: ['name', 'full_name'] },
    { key: 'email', label: 'Email', required: true, type: 'email', example: 'alex@example.com', aliases: ['email_address', 'e-mail'] },
    { key: 'role', label: 'Role', type: 'enum', enumValues: ['super_admin', 'org_admin', 'project_manager', 'designer', 'fabricator', 'installer', 'client_primary', 'client_viewer'], example: 'project_manager', aliases: ['position', 'job_role'] },
    { key: 'title', label: 'Title', type: 'text', example: 'Senior PM', aliases: ['job_title', 'position'] },
    { key: 'rate_card', label: 'Rate Card', type: 'text', exportOnly: true, example: 'Standard' },
  ],

  tasks: [
    { key: 'title', label: 'Title', required: true, type: 'text', example: 'Design review for Stage A', aliases: ['name', 'task_name', 'task'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['not_started', 'in_progress', 'review', 'done', 'blocked'], example: 'not_started', aliases: ['state'] },
    { key: 'priority', label: 'Priority', type: 'enum', enumValues: ['urgent', 'high', 'medium', 'low'], example: 'medium' },
    { key: 'description', label: 'Description', type: 'text', example: 'Review all stage designs', importOnly: true, aliases: ['desc', 'details', 'notes'] },
    { key: 'due_date', label: 'Due Date', type: 'date', example: '2026-05-01', aliases: ['deadline', 'duedate', 'due'] },
    { key: 'assigneeName', label: 'Assignee', type: 'text', exportOnly: true, example: 'Jane Doe', aliases: ['assigned_to', 'owner'] },
  ],

  equipment: [
    { key: 'name', label: 'Name', required: true, type: 'text', example: 'LED Wall Panel 4x8', aliases: ['item', 'equipment_name', 'item_name'] },
    { key: 'category', label: 'Category', required: true, type: 'text', example: 'Lighting', aliases: ['type', 'group'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['planned', 'in_production', 'in_transit', 'deployed', 'in_storage', 'retired', 'disposed'], example: 'in_storage' },
    { key: 'current_location', label: 'Location', type: 'text', example: 'Warehouse A', aliases: ['location', 'loc', 'warehouse'] },
    { key: 'serial_number', label: 'Serial #', type: 'text', example: 'SN-2026-001', aliases: ['serial', 'sn'] },
    { key: 'reservation_count', label: 'Reservations', type: 'number', exportOnly: true, example: '2' },
  ],

  assets: [
    { key: 'name', label: 'Name', required: true, type: 'text', example: 'Main Stage Backdrop', aliases: ['asset_name', 'item'] },
    { key: 'type', label: 'Type', required: true, type: 'text', example: 'Scenic', aliases: ['asset_type', 'kind'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['deployed', 'in_storage', 'in_production', 'in_transit', 'planned', 'retired', 'disposed'], example: 'in_storage' },
    { key: 'condition', label: 'Condition', type: 'enum', enumValues: ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'], example: 'good' },
    { key: 'current_value', label: 'Value', type: 'currency', example: '12000', aliases: ['value', 'worth'] },
    { key: 'location_name', label: 'Location', type: 'text', exportOnly: true, example: 'Warehouse B' },
  ],

  expenses: [
    { key: 'category', label: 'Category', required: true, type: 'text', example: 'Materials', aliases: ['type', 'expense_type'] },
    { key: 'description', label: 'Description', type: 'text', example: 'Steel framing for booth', aliases: ['desc', 'notes', 'memo'] },
    { key: 'amount', label: 'Amount', required: true, type: 'currency', example: '2500', aliases: ['cost', 'total', 'price'] },
    { key: 'expense_date', label: 'Date', required: true, type: 'date', example: '2026-03-15', aliases: ['date', 'exp_date'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['pending', 'approved', 'rejected'], example: 'pending' },
  ],

  invoices: [
    { key: 'invoice_number', label: 'Invoice #', type: 'text', exportOnly: true, example: 'INV-2026-001' },
    { key: 'client_name', label: 'Client', type: 'text', example: 'Summit Productions', aliases: ['client', 'company', 'customer'], required: true },
    { key: 'type', label: 'Type', type: 'enum', enumValues: ['deposit', 'progress', 'final', 'retainer'], example: 'deposit' },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['draft', 'sent', 'paid', 'overdue', 'void'], example: 'draft' },
    { key: 'total', label: 'Amount', type: 'currency', example: '15000', aliases: ['total_amount', 'amount'] },
    { key: 'amount_paid', label: 'Paid', type: 'currency', exportOnly: true, example: '5000' },
    { key: 'issue_date', label: 'Issue Date', type: 'date', example: '2026-03-01', aliases: ['date', 'issued'] },
    { key: 'due_date', label: 'Due Date', type: 'date', example: '2026-04-01', aliases: ['due', 'payment_due'] },
  ],

  crew: [
    { key: 'full_name', label: 'Name', required: true, type: 'text', example: 'Sam Chen', aliases: ['name', 'full_name'] },
    { key: 'email', label: 'Email', required: true, type: 'email', example: 'sam@example.com', aliases: ['email_address'] },
    { key: 'skills', label: 'Skills', type: 'text', example: 'Rigging, Lighting', aliases: ['skill', 'specialties'] },
    { key: 'hourly_rate', label: 'Rate', type: 'currency', example: '45', aliases: ['rate', 'pay_rate', 'hourly'] },
    { key: 'availability_status', label: 'Availability', type: 'enum', enumValues: ['available', 'unavailable', 'tentative'], example: 'available', aliases: ['availability'] },
    { key: 'onboarding_status', label: 'Onboarding', type: 'enum', enumValues: ['complete', 'in_progress', 'pending'], example: 'pending', aliases: ['onboarding'] },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get import-eligible fields (those not marked exportOnly) */
export function getImportFields(entityKey: string): EntityField[] {
  return (ENTITY_FIELDS[entityKey] ?? []).filter((f) => !f.exportOnly);
}

/** Get export-eligible fields (those not marked importOnly) */
export function getExportFields(entityKey: string): EntityField[] {
  return (ENTITY_FIELDS[entityKey] ?? []).filter((f) => !f.importOnly);
}

/** Get default-visible export fields */
export function getDefaultExportFields(entityKey: string): EntityField[] {
  return getExportFields(entityKey).filter((f) => f.defaultExportVisible !== false);
}

/** Get all required fields for an entity */
export function getRequiredFields(entityKey: string): EntityField[] {
  return getImportFields(entityKey).filter((f) => f.required);
}
