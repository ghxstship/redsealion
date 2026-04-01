// XPB Database Types — mirrors Supabase PostgreSQL schema

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

export type AssetStatus = 'planned' | 'in_production' | 'in_transit' | 'deployed' | 'in_storage' | 'retired' | 'disposed';

export type AssetCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export type ActorType = 'admin' | 'client' | 'system';

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
  full_name: string;
  avatar_url: string | null;
  organization_id: string;
  role: OrganizationRole;
  title: string | null;
  phone: string | null;
  rate_card: string | null;
  facility_id: string | null;
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
  _crm_external_ids: CrmExternalIds | null;
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
  role: ContactRole;
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
  probability: number | null;
  currency: string;
  total_value: number;
  total_with_addons: number;
  prepared_date: string | null;
  valid_until: string | null;
  source: string | null;
  narrative_context: NarrativeContext | null;
  payment_terms: PaymentTerms | null;
  terms_document_id: string | null;
  tags: string[];
  portal_access_token: string | null;
  portal_first_viewed_at: string | null;
  created_by: string;
  parent_proposal_id: string | null;
  phase_template_id: string | null;
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
  constraints: Record<string, unknown>;
  contact_on_site: VenueContact | null;
  sequence: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  proposal_id: string;
  number: string;
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
  taxable: boolean;
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
  taxable: boolean;
  selected: boolean;
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
  taxable: boolean;
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
  trackable: boolean;
  reusable: boolean;
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
  return_required: boolean;
  barcode: string | null;
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
  resolved: boolean;
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

// Expanded types with relations
export interface ProposalWithRelations extends Proposal {
  client?: Client;
  phases?: PhaseWithRelations[];
  venues?: Venue[];
  team_assignments?: (TeamAssignment & { user?: User })[];
  terms_document?: TermsDocument;
}

export interface PhaseWithRelations extends Phase {
  deliverables?: PhaseDeliverable[];
  addons?: PhaseAddon[];
  milestone_gate?: MilestoneGate & { requirements?: MilestoneRequirement[] };
  creative_references?: CreativeReference[];
  portfolio_links?: (PhasePortfolioLink & { portfolio_item?: PortfolioItem })[];
}
