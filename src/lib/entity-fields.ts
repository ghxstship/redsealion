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

const ENTITY_FIELDS: Record<string, EntityField[]> = {
  leads: [
    { key: 'contact_first_name', label: 'First Name', required: true, type: 'text', example: 'Jane', aliases: ['first', 'fname', 'first_name', 'given_name'] },
    { key: 'contact_last_name', label: 'Last Name', required: true, type: 'text', example: 'Doe', aliases: ['last', 'lname', 'last_name', 'surname', 'family_name'] },
    { key: 'contact_email', label: 'Email', type: 'email', example: 'jane@example.com', aliases: ['email_address', 'e-mail'] },
    { key: 'company_name', label: 'Company', type: 'text', example: 'Acme Events', aliases: ['company', 'organization', 'org', 'business'] },
    { key: 'contact_phone', label: 'Phone', type: 'phone', example: '(555) 123-4567', aliases: ['phone_number', 'tel', 'telephone', 'mobile'] },
    { key: 'source', label: 'Source', type: 'enum', enumValues: ['website', 'referral', 'linkedin', 'cold_outreach', 'lead_form', 'event', 'other'], example: 'website', aliases: ['lead_source', 'origin'] },
    { key: 'estimated_budget', label: 'Budget', type: 'currency', example: '50000', aliases: ['budget', 'est_budget', 'estimated_value'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['new', 'contacted', 'qualified', 'converted', 'lost'], example: 'new', defaultExportVisible: true },
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
    { key: 'role', label: 'Role', type: 'enum', enumValues: ['developer', 'owner', 'admin', 'controller', 'collaborator', 'client', 'contractor', 'crew', 'viewer', 'community'], example: 'collaborator', aliases: ['position', 'job_role'] },
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
    { key: 'acquisition_cost', label: 'Acquisition Cost', type: 'currency', example: '25000', aliases: ['purchase_price', 'cost'] },
    { key: 'current_value', label: 'Book Value', type: 'currency', example: '12000', aliases: ['value', 'worth', 'book_value'] },
    { key: 'depreciation_method', label: 'Depreciation Method', type: 'enum', enumValues: ['straight_line', 'declining_balance', 'declining_then_straight'], example: 'straight_line', aliases: ['depr_method'] },
    { key: 'useful_life_months', label: 'Useful Life (months)', type: 'number', example: '60', aliases: ['useful_life'] },
    { key: 'serial_number', label: 'Serial #', type: 'text', example: 'SN-2026-001', aliases: ['serial', 'sn'] },
    { key: 'warranty_start_date', label: 'Warranty Start', type: 'date', example: '2026-01-15', aliases: ['warranty_start'] },
    { key: 'warranty_end_date', label: 'Warranty End', type: 'date', example: '2028-01-15', aliases: ['warranty_end', 'warranty_expiry'] },
    { key: 'warranty_provider', label: 'Warranty Provider', type: 'text', example: 'ROE Service Center', aliases: ['warranty_vendor'] },
    { key: 'vendor_name', label: 'Vendor', type: 'text', example: 'ROE Visual', aliases: ['supplier', 'manufacturer'] },
    { key: 'insurance_policy_number', label: 'Insurance Policy #', type: 'text', example: 'POL-2026-A1', aliases: ['policy_number', 'insurance'] },
    { key: 'insurance_expiry_date', label: 'Insurance Expiry', type: 'date', example: '2027-01-15', aliases: ['insurance_end'] },
    { key: 'location_name', label: 'Location', type: 'text', exportOnly: true, example: 'Warehouse B' },
    { key: 'disposal_method', label: 'Disposal Method', type: 'enum', enumValues: ['sale', 'scrap', 'donate', 'transfer', 'write_off'], example: 'sale', exportOnly: true },
    { key: 'disposal_proceeds', label: 'Disposal Proceeds', type: 'currency', exportOnly: true, example: '5000' },
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
function getDefaultExportFields(entityKey: string): EntityField[] {
  return getExportFields(entityKey).filter((f) => f.defaultExportVisible !== false);
}

/** Get all required fields for an entity */
export function getRequiredFields(entityKey: string): EntityField[] {
  return getImportFields(entityKey).filter((f) => f.required);
}
