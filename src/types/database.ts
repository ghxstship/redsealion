// FlyteDeck Database Types — mirrors Supabase PostgreSQL schema

export type OrganizationRole =
  | 'super_admin'
  | 'org_admin'
  | 'project_manager'
  | 'designer'
  | 'fabricator'
  | 'installer'
  | 'client_primary'
  | 'client_viewer';

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'negotiating'
  | 'approved'
  | 'in_production'
  | 'active'
  | 'complete'
  | 'cancelled';

export type PhaseStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'complete'
  | 'skipped';

export type MilestoneStatus = 'pending' | 'in_progress' | 'complete';

export type RequirementStatus = 'pending' | 'in_progress' | 'complete' | 'waived';

export type RequirementAssignee = 'client' | 'producer' | 'both' | 'external_vendor';

export type TermsDocumentStatus = 'draft' | 'active' | 'archived';

export type InvoiceType = 'deposit' | 'balance' | 'change_order' | 'addon' | 'final' | 'recurring';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'void';

// BEDROCK M-004: New ENUM types
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';
export type PoStatus = 'draft' | 'sent' | 'acknowledged' | 'received' | 'cancelled';
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type TimeOffStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ChangeOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'void';
export type IntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'suspended';
export type CustomFieldType = 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean' | 'select' | 'multi_select' | 'url' | 'email' | 'phone' | 'file' | 'user' | 'relation';
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type BookingStatus = 'confirmed' | 'tentative' | 'waitlisted';

export type AssetStatus = 'planned' | 'in_production' | 'in_transit' | 'deployed' | 'in_storage' | 'retired' | 'disposed';

export type AssetCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export type ActorType = 'admin' | 'client' | 'system';

// BEDROCK M-007: Renamed from ContactRole to avoid ambiguity
export type ContactRole = 'primary' | 'billing' | 'creative' | 'operations';

export type CreativeReferenceType =
  | 'reference'
  | 'mood'
  | 'palette'
  | 'experience'
  | 'campaign'
  | 'material'
  | 'competitor'
  | 'inspiration';

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'verbal_yes'
  | 'contract_signed'
  | 'lost'
  | 'on_hold';

// JSONB Types

export interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontHeading: string;
  fontBody: string;
  portalTitle?: string;
  companyTagline?: string;
  footerText?: string;
  emailFromName?: string;
  emailReplyTo?: string;
}

export interface Facility {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  type: string;
  isHQ: boolean;
}

export interface PaymentTerms {
  structure: string;
  depositPercent: number;
  balancePercent: number;
  lateFeeRate?: number;
  creditCardSurcharge?: number;
}

export interface OrgSettings {
  timezone: string;
  currency: string;
  taxDefaults?: Record<string, unknown>;
  invoicePrefix?: string;
  proposalPrefix?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface VenueActivationDates {
  start: string;
  end: string;
}

export interface VenueLoadInStrike {
  date: string;
  startTime: string;
  endTime: string;
}

export interface VenueContact {
  name: string;
  phone: string;
  email: string;
}

export interface NarrativeContext {
  brandVoice?: string;
  audienceProfile?: string;
  experienceGoal?: string;
}

export interface CrmExternalIds {
  salesforce?: string;
  hubspot?: string;
  pipedrive?: string;
  custom?: string;
}

export interface PmMetadata {
  taskType?: string;
  estimatedHours?: number;
  assigneeRole?: string;
  dependencies?: string[];
}

export interface AssetMetadata {
  generates?: string;
  trackable?: boolean;
  reusable?: boolean;
  dimensions?: string;
  weight?: string;
  material?: string;
  storageRequirements?: string;
}

export interface ResourceMetadata {
  requiresVehicle?: boolean;
  vehicleType?: string;
  requiresCrew?: boolean;
  crewSize?: number;
  tools?: string[];
  requiresStaff?: boolean;
  staffRole?: string;
  staffQty?: number;
  triggersProcurement?: boolean;
}

export interface FinanceTrigger {
  triggersInvoice: boolean;
  invoiceType?: InvoiceType;
  percent?: number;
}

export interface PhaseTemplatePhase {
  number: string;
  name: string;
  subtitle?: string;
  defaultNarrative?: string;
  defaultDeliverables?: Array<{
    name: string;
    description: string;
    category: string;
    unit: string;
  }>;
  defaultAddOns?: Array<{
    name: string;
    description: string;
    category: string;
    unit: string;
    unitCost: number;
  }>;
  milestoneTemplate?: {
    name: string;
    requirements: Array<{
      text: string;
      assignee: RequirementAssignee;
    }>;
  };
}

export interface TermsSection {
  number: string;
  title: string;
  body: string;
  subsections?: Array<{
    number: string;
    title: string;
    body: string;
  }>;
}

export interface ExportConfig {
  fieldMappings?: Record<string, string>;
  apiEndpoint?: string;
  authConfig?: Record<string, string>;
  customFields?: Record<string, unknown>;
}

export interface AssetLocation {
  facilityId?: string;
  type?: string;
  venueId?: string;
}

// Table Row Types

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  brand_config: BrandConfig;
  facilities: Facility[];
  default_payment_terms: PaymentTerms;
  default_phase_template_id: string | null;
  settings: OrgSettings;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
  billing_email: string | null;
  payment_instructions: string | null;
  date_format: string;
  time_format: string;
  first_day_of_week: number;
  number_format: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  phases: PhaseTemplatePhase[];
  created_at: string;
  updated_at: string;
}

export interface TermsDocument {
  id: string;
  organization_id: string;
  title: string;
  version: number;
  status: TermsDocumentStatus;
  sections: TermsSection[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  organization_id: string;
  project_name: string;
  project_year: number | null;
  client_name: string | null;
  description: string | null;
  category: string;
  image_url: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  /** @deprecated Use first_name + last_name. Retained for backward compatibility. */
  full_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  organization_id: string;
  role: OrganizationRole;
  title: string | null;
  phone: string | null;
  rate_card: string | null;
  facility_id: string | null;
  notification_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  company_name: string;
  industry: string | null;
  billing_address: Address | null;
  tags: string[];
  source: string | null;
  crm_external_ids: CrmExternalIds | null;
  website: string | null;
  linkedin: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  id: string;
  client_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string;
  phone: string | null;
  contact_role: ContactRole;
  is_decision_maker: boolean;
  is_signatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  subtitle: string | null;
  version: number;
  status: ProposalStatus;
  current_phase_id: string | null;
  probability_percent: number | null;
  currency: string;
  total_value: number;
  total_with_addons: number;
  prepared_date: string | null;
  valid_until: string | null;
  source: string | null;
  narrative_context: NarrativeContext | null;
  payment_terms: PaymentTerms | null;
  terms_document_id: string | null;
  assumptions: string[];
  tags: string[];
  portal_access_token: string | null;
  portal_first_viewed_at: string | null;
  created_by: string;
  parent_proposal_id: string | null;
  phase_template_id: string | null;
  deal_stage: DealStage | null;
  expected_close_date: string | null;
  pipeline_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  proposal_id: string;
  name: string;
  address: Address;
  type: string;
  activation_dates: VenueActivationDates | null;
  load_in: VenueLoadInStrike | null;
  strike: VenueLoadInStrike | null;
  site_constraints: Record<string, unknown>;
  contact_on_site: VenueContact | null;
  sequence: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  proposal_id: string;
  phase_number: string;
  name: string;
  subtitle: string | null;
  status: PhaseStatus;
  terms_sections: string[];
  narrative: string | null;
  phase_investment: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseDeliverable {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  details: string[];
  category: string;
  unit: string;
  qty: number;
  unit_cost: number;
  total_cost: number;
  is_taxable: boolean;
  terms_sections: string[] | null;
  pm_metadata: PmMetadata | null;
  asset_metadata: AssetMetadata | null;
  resource_metadata: ResourceMetadata | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseAddon {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  qty: number;
  unit_cost: number;
  total_cost: number;
  is_taxable: boolean;
  is_selected: boolean;
  terms_sections: string[] | null;
  mutually_exclusive_group: string | null;
  pm_metadata: PmMetadata | null;
  asset_metadata: AssetMetadata | null;
  resource_metadata: ResourceMetadata | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MilestoneGate {
  id: string;
  phase_id: string;
  name: string;
  unlocks_description: string | null;
  status: MilestoneStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneRequirement {
  id: string;
  milestone_id: string;
  text: string;
  status: RequirementStatus;
  assignee: RequirementAssignee;
  due_offset: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  finance_trigger: FinanceTrigger | null;
  evidence_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreativeReference {
  id: string;
  phase_id: string;
  label: string;
  description: string | null;
  type: CreativeReferenceType;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PhasePortfolioLink {
  id: string;
  phase_id: string;
  portfolio_item_id: string;
  context_description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAssignment {
  id: string;
  proposal_id: string;
  role: string;
  user_id: string;
  facility_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  proposal_id: string;
  client_id: string;
  organization_id: string;
  invoice_number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  triggered_by_milestone_id: string | null;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  currency: string;
  memo: string | null;
  payment_link: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  is_taxable: boolean;
  phase_number: string | null;
  category: string | null;
  deliverable_id: string | null;
  addon_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  proposal_id: string;
  organization_id: string;
  source_deliverable_id: string | null;
  source_addon_id: string | null;
  name: string;
  description: string | null;
  type: string;
  category: string;
  is_trackable: boolean;
  is_reusable: boolean;
  dimensions: string | null;
  weight: string | null;
  material: string | null;
  storage_requirements: string | null;
  acquisition_cost: number | null;
  current_value: number | null;
  depreciation_method: string | null;
  useful_life_months: number | null;
  status: AssetStatus;
  condition: AssetCondition;
  deployment_count: number;
  max_deployments: number | null;
  current_location: AssetLocation | null;
  is_return_required: boolean;
  barcode: string | null;
  serial_number: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface AssetLocationHistory {
  id: string;
  asset_id: string;
  location: AssetLocation;
  moved_at: string;
  moved_by: string | null;
  condition_at_move: string | null;
  notes: string | null;
  photo_urls: string[];
  created_at: string;
}

export interface ActivityLog {
  id: string;
  proposal_id: string;
  organization_id: string;
  actor_id: string;
  actor_type: ActorType;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ProposalComment {
  id: string;
  proposal_id: string;
  phase_id: string | null;
  deliverable_id: string | null;
  addon_id: string | null;
  author_id: string;
  body: string;
  is_internal: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileAttachment {
  id: string;
  proposal_id: string;
  phase_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  is_client_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportConfiguration {
  id: string;
  organization_id: string;
  platform: string;
  config: ExportConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesPipeline {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  stages: string[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  pipeline_id: string | null;
  proposal_id: string | null;
  client_id: string;
  title: string;
  deal_value: number;
  stage: DealStage;
  probability: number;
  expected_close_date: string | null;
  owner_id: string | null;
  notes: string | null;
  lost_reason: string | null;
  won_date: string | null;
  lost_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  organization_id: string;
  actor_id: string | null;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ClientInteraction {
  id: string;
  client_id: string;
  organization_id: string;
  user_id: string | null;
  type: string;
  subject: string;
  body: string | null;
  occurred_at: string;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  organization_id: string;
  amount: number;
  method: string;
  reference: string | null;
  received_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface EmailNotification {
  id: string;
  organization_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface SavedReport {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  created_by: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// Change Orders
// ChangeOrderStatus type moved to BEDROCK ENUM section above

export interface ChangeOrder {
  id: string;
  proposal_id: string;
  organization_id: string;
  number: number;
  title: string;
  description: string | null;
  reason: string | null;
  status: ChangeOrderStatus;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  scope_additions: ChangeOrderLineItem[];
  scope_removals: ChangeOrderLineItem[];
  schedule_impact_days: number | null;
  original_value: number;
  revised_value: number;
  net_change: number;
  created_at: string;
  updated_at: string;
}

export interface ChangeOrderLineItem {
  description: string;
  phase_number: string | null;
  category: string | null;
  qty: number;
  unit_cost: number;
  total: number;
}

// Sprint 5: Integration types

export interface Integration {
  id: string;
  organization_id: string;
  platform: string;
  status: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSyncLog {
  id: string;
  integration_id: string;
  organization_id: string;
  direction: string;
  entity_type: string;
  entity_count: number;
  status: string;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface WebhookEndpoint {
  id: string;
  organization_id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string;
}

// Sprint 7: Automation types

export interface Automation {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  organization_id: string;
  status: string;
  trigger_data: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface EmailThread {
  id: string;
  organization_id: string;
  deal_id: string | null;
  client_id: string | null;
  subject: string;
  last_message_at: string;
  message_count: number;
  created_at: string;
}

export interface EmailMessage {
  id: string;
  thread_id: string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  subject: string;
  body_text: string | null;
  body_html: string | null;
  direction: string;
  external_id: string | null;
  sent_at: string;
  created_at: string;
}

// Sprint 8: Advanced invoicing types

export interface CreditNote {
  id: string;
  organization_id: string;
  invoice_id: string;
  credit_number: string;
  amount: number;
  reason: string | null;
  issued_date: string;
  created_by: string | null;
  created_at: string;
}


export interface RecurringInvoiceSchedule {
  id: string;
  organization_id: string;
  client_id: string;
  template_data: Record<string, unknown>;
  frequency: string;
  next_issue_date: string;
  end_date: string | null;
  is_active: boolean;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomReport {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  query_config: Record<string, unknown>;
  visualization_type: string;
  columns: unknown[];
  filters: unknown[];
  created_by: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

// Sprint 9: Time Tracking

export interface TimeEntry {
  id: string;
  organization_id: string;
  user_id: string;
  proposal_id: string | null;
  phase_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean;
  hourly_rate: number | null;
  is_approved: boolean;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: string;
  organization_id: string;
  user_id: string;
  week_start: string;
  status: TimesheetStatus;
  total_hours: number;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimePolicy {
  id: string;
  organization_id: string;
  name: string;
  max_hours_per_day: number;
  max_hours_per_week: number;
  requires_approval: boolean;
  overtime_multiplier: number;
  created_at: string;
  updated_at: string;
}

// Sprint 10: Resource Scheduling + Budgeting

export interface ResourceAllocation {
  id: string;
  organization_id: string;
  user_id: string;
  proposal_id: string | null;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  role: string | null;
  booking_status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapacityOverride {
  id: string;
  organization_id: string;
  user_id: string;
  date: string;
  available_hours: number;
  reason: string | null;
  created_at: string;
}

export interface ProjectBudget {
  id: string;
  proposal_id: string;
  organization_id: string;
  total_budget: number;
  spent: number;
  alert_threshold_percent: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetLineItem {
  id: string;
  budget_id: string;
  category: string;
  description: string | null;
  planned_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetAlert {
  id: string;
  budget_id: string;
  organization_id: string;
  type: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

// Sprint 11: Profitability + Expenses

export interface ProjectCost {
  id: string;
  proposal_id: string;
  organization_id: string;
  category: string;
  description: string | null;
  amount: number;
  cost_date: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  user_id: string;
  proposal_id: string | null;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  proposal_id: string | null;
  po_number: string;
  vendor_name: string;
  description: string | null;
  total_amount: number;
  status: PoStatus;
  issued_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueRecognition {
  id: string;
  organization_id: string;
  proposal_id: string;
  period_start: string;
  period_end: string;
  recognized_amount: number;
  deferred_amount: number;
  method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Sprint 12: People / HR

export interface TimeOffPolicy {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  days_per_year: number;
  carry_over_max: number;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffBalance {
  id: string;
  user_id: string;
  organization_id: string;
  policy_id: string;
  year: number;
  entitled_days: number;
  used_days: number;
  carried_over: number;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  user_id: string;
  organization_id: string;
  policy_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: TimeOffStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HolidayCalendar {
  id: string;
  organization_id: string;
  name: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
}

export interface OrgChartPosition {
  id: string;
  organization_id: string;
  user_id: string | null;
  title: string;
  department: string | null;
  reports_to: string | null;
  level: number;
  created_at: string;
  updated_at: string;
}

// Sprint 13: Tasks, Custom Fields, Scenarios

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  end_date?: string;
  end_after_occurrences?: number;
  occurrences_created?: number;
}

export interface Task {
  id: string;
  organization_id: string;
  proposal_id: string | null;
  phase_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  sort_order: number;
  recurrence_rule: RecurrenceRule | null;
  recurring_parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  type: DependencyType;
  lag_days: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskWithSubtasks extends Task {
  subtasks?: Task[];
  comments_count?: number;
  assignee?: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
}

export interface TaskCommentWithAuthor extends TaskComment {
  author?: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
}

export interface CustomFieldDefinition {
  id: string;
  organization_id: string;
  entity_type: string;
  field_name: string;
  field_key: string;
  field_type: CustomFieldType;
  field_options: Record<string, unknown> | null;
  is_required: boolean;
  sort_order: number;
  description: string | null;
  section: string | null;
  is_active: boolean;
  is_filterable: boolean;
  is_visible_in_list: boolean;
  visibility_roles: string[];
  created_by: string | null;
  default_value: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  field_definition_id: string;
  entity_id: string;
  entity_type: string | null;
  value: unknown;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_boolean: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalScenario {
  id: string;
  proposal_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  adjustments: Record<string, unknown>;
  total_value: number;
  is_baseline: boolean;
  created_at: string;
  updated_at: string;
}

// Sprint 13b: Approval Workflows & Cost Rates

export type ApprovalEntityType =
  | 'expense'
  | 'budget'
  | 'change_order'
  | 'timesheet'
  | 'purchase_order'
  | 'time_off_request'
  | 'invoice';

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  entity_title: string;
  requested_by: string;
  status: ApprovalStatus;
  approvers: string[];
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostRate {
  id: string;
  organization_id: string;
  role: string;
  hourly_cost: number;
  hourly_billable: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

// Sprint 14: AI, Security, Billing


export interface AiConversation {
  id: string;
  organization_id: string;
  user_id: string;
  title: string | null;
  messages: unknown[];
  context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Permission {
  id: string;
  organization_id: string;
  role: string;
  resource: string;
  action: string;
  allowed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SsoConfiguration {
  id: string;
  organization_id: string;
  provider: string;
  client_id: string;
  metadata_url: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Expanded types with relations
export interface ProposalWithRelations extends Proposal {
  client?: Client;
  phases?: PhaseWithRelations[];
  venues?: Venue[];
  team_assignments?: (TeamAssignment & { user?: User })[];
  terms_document?: TermsDocument;
}

export interface DealWithRelations extends Deal {
  client?: Client;
  proposal?: Proposal;
  owner?: User;
  activities?: DealActivity[];
}

export interface PhaseWithRelations extends Phase {
  deliverables?: PhaseDeliverable[];
  addons?: PhaseAddon[];
  milestone_gate?: MilestoneGate & { requirements?: MilestoneRequirement[] };
  creative_references?: CreativeReference[];
  portfolio_links?: (PhasePortfolioLink & { portfolio_item?: PortfolioItem })[];
}

// ---------------------------------------------------------------------------
// Sprint A: Crew Management
// ---------------------------------------------------------------------------

export type CrewAvailabilityStatus = 'available' | 'unavailable' | 'tentative';

export type CrewBookingStatus = 'offered' | 'accepted' | 'declined' | 'confirmed' | 'cancelled';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'complete';

export type RateType = 'hourly' | 'day' | 'overtime' | 'per_diem' | 'travel' | 'flat';

export interface Certification {
  name: string;
  issuer: string | null;
  expires_at: string | null;
  document_url: string | null;
}

export interface CrewProfile {
  id: string;
  user_id: string;
  organization_id: string;
  skills: string[];
  certifications: Certification[];
  hourly_rate: number | null;
  day_rate: number | null;
  ot_rate: number | null;
  per_diem_rate: number | null;
  travel_rate: number | null;
  availability_default: CrewAvailabilityStatus;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  onboarding_status: OnboardingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrewAvailability {
  id: string;
  user_id: string;
  organization_id: string;
  date: string;
  status: CrewAvailabilityStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrewBooking {
  id: string;
  organization_id: string;
  proposal_id: string;
  venue_id: string | null;
  user_id: string;
  role: string;
  status: CrewBookingStatus;
  shift_start: string;
  shift_end: string;
  call_time: string | null;
  rate_type: RateType;
  rate_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrewProfileWithUser extends CrewProfile {
  user?: User;
}

export interface CrewBookingWithUser extends CrewBooking {
  user?: User;
  proposal?: Proposal;
  venue?: Venue;
}

// ---------------------------------------------------------------------------
// Sprint B: Equipment Management
// ---------------------------------------------------------------------------

export type EquipmentReservationStatus = 'reserved' | 'checked_out' | 'returned' | 'cancelled';

export type MaintenanceType = 'repair' | 'inspection' | 'cleaning' | 'calibration';

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'complete' | 'cancelled';

export interface EquipmentBundle {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  items: BundleItem[];
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  asset_id: string;
  quantity: number;
}

export interface EquipmentReservation {
  id: string;
  organization_id: string;
  asset_id: string;
  proposal_id: string;
  venue_id: string | null;
  quantity: number;
  reserved_from: string;
  reserved_until: string;
  status: EquipmentReservationStatus;
  checked_out_by: string | null;
  checked_out_at: string | null;
  returned_by: string | null;
  returned_at: string | null;
  condition_on_return: AssetCondition | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  organization_id: string;
  asset_id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string | null;
  scheduled_date: string;
  completed_date: string | null;
  cost: number | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Sprint C: E-Signatures + Notifications
// ---------------------------------------------------------------------------

export type ESignStatus = 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';

export interface ESignatureRequest {
  id: string;
  organization_id: string;
  proposal_id: string | null;
  document_type: string;
  document_title: string;
  signer_name: string;
  signer_email: string;
  token: string;
  status: ESignStatus;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  signature_data: string | null;
  ip_address: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationChannel = 'email' | 'sms' | 'in_app';

export interface NotificationPreference {
  id: string;
  user_id: string;
  organization_id: string;
  event_type: string;
  channel: NotificationChannel;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Sprint D: Event Calendar + Shifts
// ---------------------------------------------------------------------------

export interface Shift {
  id: string;
  organization_id: string;
  venue_id: string;
  proposal_id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  call_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarProvider = 'google' | 'outlook' | 'ical';

export interface CalendarSyncConfig {
  id: string;
  user_id: string;
  organization_id: string;
  provider: CalendarProvider;
  calendar_id: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Sprint E: Lead Capture + Payments
// ---------------------------------------------------------------------------

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: string;
  organization_id: string;
  source: string;
  company_name: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  event_type: string | null;
  event_date: string | null;
  estimated_budget: number | null;
  message: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  converted_to_deal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadForm {
  id: string;
  organization_id: string;
  name: string;
  fields: LeadFormField[];
  thank_you_message: string | null;
  auto_response_enabled: boolean;
  auto_response_subject: string | null;
  auto_response_body: string | null;
  is_active: boolean;
  embed_token: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'date' | 'number';
  required: boolean;
  options?: string[];
}

export interface PaymentLink {
  id: string;
  organization_id: string;
  invoice_id: string;
  provider: string;
  external_id: string;
  url: string;
  amount: number;
  currency: string;
  status: 'active' | 'paid' | 'expired';
  expires_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Sprint F: Onboarding + Payroll
// ---------------------------------------------------------------------------

export interface OnboardingDocument {
  id: string;
  organization_id: string;
  user_id: string;
  type: 'w9' | 'nda' | 'i9' | 'direct_deposit' | 'emergency_contact' | 'other';
  name: string;
  file_url: string | null;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Sprint G: Warehouse + Packing Lists
// ---------------------------------------------------------------------------

export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled';

export interface WarehouseTransfer {
  id: string;
  organization_id: string;
  from_facility_id: string;
  to_facility_id: string;
  status: TransferStatus;
  initiated_by: string;
  items: WarehouseTransferItem[];
  shipped_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseTransferItem {
  asset_id: string;
  quantity: number;
  condition: AssetCondition | null;
}

// Settings types

export interface UserPreferences {
  id: string;
  user_id: string;
  organization_id: string;
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  date_format: string;
  time_format: '12h' | '24h';
  first_day_of_week: number;
  number_format: string;
  language: string;
  default_calendar_view: 'month' | 'week' | 'day';
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
}

export type TagEntityType = 'equipment' | 'crew' | 'project' | 'lead' | 'client';

export interface Tag {
  id: string;
  organization_id: string;
  entity_type: TagEntityType;
  name: string;
  color: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  organization_id: string;
  event_type: string;
  subject_template: string;
  body_template: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type DocumentDefaultType = 'proposal' | 'invoice' | 'contract' | 'sow' | 'crew_call_sheet';
export type DocumentDefaultSection = 'terms_and_conditions' | 'disclaimer' | 'notes' | 'scope_header' | 'scope_footer' | 'payment_instructions';

export interface DocumentDefault {
  id: string;
  organization_id: string;
  document_type: DocumentDefaultType;
  section: DocumentDefaultSection;
  content: string;
  created_at: string;
  updated_at: string;
}
