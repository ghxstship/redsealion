/**
 * Canonical column selections per table.
 *
 * Instead of `.select('*')`, routes should import the relevant column
 * list from here. This prevents over-fetching, documents the contract
 * between DB and application, and makes schema changes auditable.
 *
 * @module lib/dal/columns
 */

// ─── Core Entities ─────────────────────────────────────────────────────────

export const PROPOSAL_COLUMNS = [
  'id', 'organization_id', 'client_id', 'name', 'subtitle', 'version',
  'status', 'currency', 'total_value', 'total_with_addons',
  'narrative_context', 'payment_terms', 'phase_template_id',
  'prepared_date', 'valid_until', 'created_by', 'tags',
  'created_at', 'updated_at',
].join(', ');

export const PROPOSAL_LIST_COLUMNS = [
  'id', 'client_id', 'name', 'status', 'total_value',
  'total_with_addons', 'prepared_date', 'valid_until',
  'created_at', 'updated_at',
].join(', ');

export const CLIENT_COLUMNS = [
  'id', 'organization_id', 'company_name', 'industry', 'website',
  'linkedin', 'source', 'notes', 'tags', 'billing_address',
  'is_active', 'created_at', 'updated_at',
].join(', ');

export const CLIENT_LIST_COLUMNS = [
  'id', 'company_name', 'industry', 'source', 'is_active',
  'tags', 'created_at', 'updated_at',
].join(', ');

export const INVOICE_COLUMNS = [
  'id', 'organization_id', 'client_id', 'proposal_id',
  'invoice_number', 'type', 'status', 'amount', 'tax_amount',
  'total', 'amount_paid', 'currency', 'due_date', 'sent_at',
  'paid_at', 'payment_method', 'notes', 'line_items',
  'created_at', 'updated_at',
].join(', ');

export const INVOICE_LIST_COLUMNS = [
  'id', 'client_id', 'proposal_id', 'invoice_number', 'type',
  'status', 'total', 'amount_paid', 'due_date', 'sent_at',
  'created_at', 'updated_at',
].join(', ');

export const TASK_COLUMNS = [
  'id', 'organization_id', 'title', 'description', 'status',
  'priority', 'assignee_id', 'proposal_id', 'phase_id',
  'due_date', 'start_date', 'estimated_hours', 'actual_hours',
  'tags', 'created_at', 'updated_at',
].join(', ');

export const DEAL_COLUMNS = [
  'id', 'organization_id', 'client_id', 'proposal_id', 'name',
  'deal_value', 'stage', 'probability', 'expected_close_date',
  'owner_id', 'notes', 'tags', 'created_at', 'updated_at',
].join(', ');

export const LEAD_COLUMNS = [
  'id', 'organization_id', 'first_name', 'last_name', 'email',
  'phone', 'company', 'source', 'status', 'score',
  'assigned_to', 'notes', 'tags', 'form_id',
  'created_at', 'updated_at',
].join(', ');

// ─── Equipment & Warehouse ─────────────────────────────────────────────────

export const ASSET_COLUMNS = [
  'id', 'organization_id', 'name', 'category', 'type',
  'serial_number', 'barcode', 'status', 'condition',
  'purchase_date', 'purchase_cost', 'current_value',
  'location', 'warehouse_zone', 'notes', 'metadata',
  'is_trackable', 'created_at', 'updated_at',
].join(', ');

export const ASSET_LIST_COLUMNS = [
  'id', 'name', 'category', 'type', 'serial_number', 'barcode',
  'status', 'condition', 'location', 'warehouse_zone',
  'is_trackable', 'created_at',
].join(', ');

export const MAINTENANCE_COLUMNS = [
  'id', 'asset_id', 'organization_id', 'type', 'status',
  'description', 'scheduled_date', 'completed_date',
  'cost', 'performed_by', 'notes',
  'created_at', 'updated_at',
].join(', ');

export const RESERVATION_COLUMNS = [
  'id', 'organization_id', 'asset_id', 'proposal_id',
  'reserved_by', 'start_date', 'end_date', 'status',
  'notes', 'created_at', 'updated_at',
].join(', ');

export const BUNDLE_COLUMNS = [
  'id', 'organization_id', 'name', 'description',
  'items', 'tags', 'created_at', 'updated_at',
].join(', ');

export const TRANSFER_COLUMNS = [
  'id', 'organization_id', 'from_location', 'to_location',
  'status', 'items', 'initiated_by', 'notes',
  'created_at', 'updated_at',
].join(', ');

export const CHECK_IN_OUT_COLUMNS = [
  'id', 'organization_id', 'asset_id', 'user_id',
  'type', 'condition_on_return', 'notes', 'photos',
  'created_at',
].join(', ');

// ─── People & Crew ─────────────────────────────────────────────────────────

export const USER_COLUMNS = [
  'id', 'organization_id', 'full_name', 'email', 'role',
  'title', 'avatar_url', 'phone', 'facility_id',
  'rate_card', 'status', 'created_at', 'updated_at',
].join(', ');

export const TIME_ENTRY_COLUMNS = [
  'id', 'organization_id', 'user_id', 'proposal_id',
  'task_id', 'date', 'hours', 'description', 'is_billable',
  'rate', 'created_at', 'updated_at',
].join(', ');

// ─── Automations ───────────────────────────────────────────────────────────

export const AUTOMATION_COLUMNS = [
  'id', 'organization_id', 'name', 'description',
  'trigger_type', 'trigger_config', 'action_type', 'action_config',
  'is_active', 'run_count', 'last_run_at',
  'created_at', 'updated_at',
].join(', ');

export const AUTOMATION_RUN_COLUMNS = [
  'id', 'automation_id', 'organization_id', 'status',
  'trigger_data', 'result', 'completed_at', 'created_at',
].join(', ');

// ─── Harbor Master ─────────────────────────────────────────────────────────

export const INVITATION_COLUMNS = [
  'id', 'organization_id', 'email', 'role_id', 'status',
  'invited_by', 'accepted_at', 'expires_at',
  'created_at', 'updated_at',
].join(', ');

export const INVITE_CODE_COLUMNS = [
  'id', 'organization_id', 'code', 'role_id', 'status',
  'max_uses', 'use_count', 'created_by', 'expires_at',
  'created_at', 'updated_at',
].join(', ');

export const JOIN_REQUEST_COLUMNS = [
  'id', 'organization_id', 'user_id', 'status',
  'message', 'reviewed_by', 'reviewed_at',
  'created_at', 'updated_at',
].join(', ');

export const MEMBERSHIP_COLUMNS = [
  'id', 'organization_id', 'user_id', 'role_id',
  'status', 'created_at', 'updated_at',
].join(', ');

export const ROLE_COLUMNS = [
  'id', 'organization_id', 'name', 'description',
  'is_system', 'hierarchy_level', 'permissions',
  'created_at', 'updated_at',
].join(', ');

// ─── Phases & Deliverables ─────────────────────────────────────────────────

export const PHASE_COLUMNS = [
  'id', 'proposal_id', 'phase_number', 'name', 'subtitle',
  'status', 'terms_sections', 'narrative', 'phase_investment',
  'sort_order', 'created_at', 'updated_at',
].join(', ');

export const DELIVERABLE_COLUMNS = [
  'id', 'phase_id', 'name', 'description', 'details',
  'category', 'unit', 'qty', 'unit_cost', 'total_cost',
  'is_taxable', 'sort_order', 'created_at',
].join(', ');

export const ADDON_COLUMNS = [
  'id', 'phase_id', 'name', 'description', 'category',
  'unit', 'qty', 'unit_cost', 'total_cost', 'is_taxable',
  'is_selected', 'mutually_exclusive_group', 'sort_order',
  'created_at',
].join(', ');

export const MILESTONE_COLUMNS = [
  'id', 'phase_id', 'name', 'unlocks_description',
  'status', 'created_at', 'updated_at',
].join(', ');

export const MILESTONE_REQUIREMENT_COLUMNS = [
  'id', 'milestone_id', 'text', 'status', 'assignee',
  'evidence_required', 'evidence_url', 'sort_order',
  'created_at',
].join(', ');

// ─── Documents ─────────────────────────────────────────────────────────────

export const PAYMENT_LINK_COLUMNS = [
  'id', 'organization_id', 'invoice_id', 'amount',
  'currency', 'url', 'status', 'provider',
  'expires_at', 'created_at',
].join(', ');

// ─── Crew ──────────────────────────────────────────────────────────────────

export const CREW_MEMBER_COLUMNS = [
  'id', 'organization_id', 'user_id', 'role', 'department',
  'hourly_rate', 'day_rate', 'overtime_rate', 'certifications',
  'skills', 'emergency_contact', 'status',
  'created_at', 'updated_at',
].join(', ');

export const CREW_BOOKING_COLUMNS = [
  'id', 'organization_id', 'crew_member_id', 'proposal_id',
  'start_date', 'end_date', 'role', 'status', 'notes',
  'rate', 'rate_type', 'created_at', 'updated_at',
].join(', ');

export const CREW_AVAILABILITY_COLUMNS = [
  'id', 'crew_member_id', 'organization_id',
  'start_date', 'end_date', 'status', 'notes',
  'created_at', 'updated_at',
].join(', ');

export const CREW_DOCUMENT_COLUMNS = [
  'id', 'crew_member_id', 'organization_id',
  'name', 'type', 'url', 'expires_at', 'status',
  'created_at', 'updated_at',
].join(', ');

// ─── Proposals: Venues & Teams ─────────────────────────────────────────────

export const VENUE_COLUMNS = [
  'id', 'proposal_id', 'name', 'address', 'city', 'state',
  'zip', 'country', 'contact_name', 'contact_email',
  'contact_phone', 'notes', 'created_at',
].join(', ');

export const TEAM_ASSIGNMENT_COLUMNS = [
  'id', 'proposal_id', 'user_id', 'role', 'allocation_percent',
  'start_date', 'end_date', 'hourly_rate', 'notes',
  'created_at', 'updated_at',
].join(', ');

// ─── Organizations ─────────────────────────────────────────────────────────

export const ORGANIZATION_COLUMNS = [
  'id', 'name', 'slug', 'logo_url', 'industry',
  'subscription_tier', 'stripe_customer_id',
  'invite_expiry_hours', 'join_policy',
  'max_seats_internal', 'max_seats_client',
  'settings', 'created_at', 'updated_at',
].join(', ');

// ─── Clients: Contacts ─────────────────────────────────────────────────────

export const CLIENT_CONTACT_COLUMNS = [
  'id', 'client_id', 'name', 'email', 'phone',
  'title', 'is_primary', 'notes',
  'created_at', 'updated_at',
].join(', ');

// ─── Invoices: Sub-tables ──────────────────────────────────────────────────

export const INVOICE_LINE_ITEM_COLUMNS = [
  'id', 'invoice_id', 'description', 'qty', 'unit_price',
  'total', 'sort_order', 'created_at',
].join(', ');

export const INVOICE_PAYMENT_COLUMNS = [
  'id', 'invoice_id', 'amount', 'method', 'reference',
  'paid_at', 'notes', 'created_at',
].join(', ');

// ─── Change Orders ─────────────────────────────────────────────────────────

export const CHANGE_ORDER_COLUMNS = [
  'id', 'proposal_id', 'organization_id', 'title',
  'description', 'status', 'amount', 'requested_by',
  'approved_by', 'created_at', 'updated_at',
].join(', ');

// ─── Emails ────────────────────────────────────────────────────────────────

export const EMAIL_THREAD_COLUMNS = [
  'id', 'organization_id', 'subject', 'client_id',
  'proposal_id', 'status', 'last_message_at',
  'created_at', 'updated_at',
].join(', ');

export const EMAIL_MESSAGE_COLUMNS = [
  'id', 'thread_id', 'from_address', 'to_addresses',
  'subject', 'body', 'direction', 'sent_at',
  'created_at',
].join(', ');

// ─── Equipment Bundles ─────────────────────────────────────────────────────

export const EQUIPMENT_BUNDLE_COLUMNS = [
  'id', 'organization_id', 'name', 'description',
  'items', 'tags', 'created_at', 'updated_at',
].join(', ');

// ─── Lead Forms ────────────────────────────────────────────────────────────

export const LEAD_FORM_COLUMNS = [
  'id', 'organization_id', 'name', 'description',
  'fields', 'status', 'embed_code', 'submission_count',
  'created_at', 'updated_at',
].join(', ');

// ─── Deal Activities ───────────────────────────────────────────────────────

export const DEAL_ACTIVITY_COLUMNS = [
  'id', 'deal_id', 'user_id', 'type', 'description',
  'metadata', 'created_at',
].join(', ');

// ─── Warehouse Transfers ───────────────────────────────────────────────────

export const WAREHOUSE_TRANSFER_COLUMNS = [
  'id', 'organization_id', 'from_location', 'to_location',
  'status', 'items', 'initiated_by', 'completed_by',
  'notes', 'created_at', 'updated_at',
].join(', ');

// ─── Seat Allocations ──────────────────────────────────────────────────────

export const SEAT_ALLOCATION_COLUMNS = [
  'id', 'organization_id', 'seat_type', 'user_id',
  'status', 'created_at', 'updated_at',
].join(', ');
