import type { Database } from './database';

type PublicEnums = Database['public']['Enums'];
export type AdvanceStatus = PublicEnums['advance_status'];
export type AvailabilityStatus = PublicEnums['availability_status'];
export type BidStatus = PublicEnums['bid_status'];
export type BookingStatus = PublicEnums['booking_status'];
export type DealStage = PublicEnums['deal_stage'];
export type EventType = PublicEnums['event_type'];
export type InvoiceStatus = PublicEnums['invoice_status'];
export type LeadStatus = PublicEnums['lead_status'];
export type LocationType = PublicEnums['location_type'];
export type MilestoneStatus = PublicEnums['milestone_status'];
export type OnboardingDocStatus = PublicEnums['onboarding_doc_status'];
export type OrgRole = PublicEnums['org_role'];
export type PoStatus = PublicEnums['po_status'];
export type ProjectRole = PublicEnums['project_role'];
export type ProposalStatus = PublicEnums['proposal_status'];
export type TaskPriority = PublicEnums['task_priority'];
export type TaskStatus = PublicEnums['task_status'];
export type TermsDocumentStatus = PublicEnums['terms_document_status'];
export type TransferStatus = PublicEnums['transfer_status'];
// Provide common UI fallbacks combined with db types 
// e.g. for pipelines using UI aliases
export type PipelineStageKey = DealStage | 'discovery' | 'qualification' | 'proposal' | 'closed_won' | 'closed_lost';
