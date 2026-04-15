/**
 * Unified Document Generation API Route
 *
 * GET /api/documents/[type]?proposalId=xxx&invoiceId=xxx&venueId=xxx&date=xxx&...
 *
 * Generates DOCX documents based on document type. Returns binary DOCX as
 * an attachment with appropriate Content-Disposition header.
 */

import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { DOCUMENT_TYPES, type DocumentType } from '@/lib/documents/engine';
import { castRelation } from '@/lib/supabase/cast-relation';
import type { PermissionResource } from '@/lib/permissions';

import type {
  Organization,
  Proposal,
  Client,
  Phase,
  Venue,
  MilestoneGate,
  MilestoneRequirement,
  TeamAssignment,
  User,
  Invoice,
  InvoiceLineItem,
  Asset,
  ChangeOrder,
  TermsDocument,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Template imports
// ---------------------------------------------------------------------------

import { generatePunchList } from '@/lib/documents/templates/punch-list';
import { generateLoadInStrike } from '@/lib/documents/templates/load-in-strike';
import { generateCrewCallSheet } from '@/lib/documents/templates/crew-call-sheet';
import { generateWrapReport } from '@/lib/documents/templates/wrap-report';
import { generateProposal } from '@/lib/documents/templates/proposal';
import { generateInvoice } from '@/lib/documents/templates/invoice';
import { generateTerms } from '@/lib/documents/templates/terms';
import { generateChangeOrder } from '@/lib/documents/templates/change-order';
import { generateBudgetSummary } from '@/lib/documents/templates/budget-summary';
import { generateCreditNote } from '@/lib/documents/templates/credit-note';
import { generateProductionSchedule } from '@/lib/documents/templates/production-schedule';
import { generateBom } from '@/lib/documents/templates/bom';
import { generateAssetInventory } from '@/lib/documents/templates/asset-inventory';
import { generatePackingList } from '@/lib/documents/templates/packing-list';
import { generatePurchaseOrder } from '@/lib/documents/templates/purchase-order';
import { generateWorkOrder } from '@/lib/documents/templates/work-order';
import { generateShipmentManifest } from '@/lib/documents/templates/shipment-manifest';
import { generateGoodsReceipt } from '@/lib/documents/templates/goods-receipt';
import { generateRentalAgreement } from '@/lib/documents/templates/rental-agreement';
import { generateDailyReport } from '@/lib/documents/templates/daily-report';
import { generateExpenseReport } from '@/lib/documents/templates/expense-report';
import { generateComplianceCertificate } from '@/lib/documents/templates/compliance-certificate';
import { generateQuote } from '@/lib/documents/templates/quote';
import { generatePayrollSummary } from '@/lib/documents/templates/payroll-summary';

import { createLogger } from '@/lib/logger';

const log = createLogger('documents');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

function docxResponse(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  });
}

/** Map document type → RBAC permission resource */
function permResourceForType(type: DocumentType): PermissionResource {
  switch (type) {
    case 'invoice':
    case 'credit-note':
      return 'invoices';
    case 'purchase-order':
    case 'goods-receipt':
      return 'purchase_orders';
    case 'work-order':
      return 'work_orders';
    case 'shipment-manifest':
    case 'packing-list':
      return 'warehouse';
    case 'rental-agreement':
      return 'rentals';
    case 'asset-inventory':
    case 'bom':
      return 'assets';
    case 'expense-report':
      return 'expenses';
    case 'compliance-certificate':
      return 'compliance';
    case 'daily-report':
      return 'events';
    case 'payroll-summary':
      return 'crew';
    case 'quote':
      return 'advances';
    default:
      return 'proposals';
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  // Validate document type
  if (!isValidDocumentType(type)) {
    return NextResponse.json(
      { error: `Invalid document type: ${type}. Valid types: ${DOCUMENT_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  // Determine required permission
  const permResource = permResourceForType(type);
  const perm = await checkPermission(permResource, 'view');

  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;
  const url = new URL(request.url);
  const proposalId = url.searchParams.get('proposalId');
  const venueId = url.searchParams.get('venueId');
  const date = url.searchParams.get('date');
  const invoiceId = url.searchParams.get('invoiceId');
  const workOrderId = url.searchParams.get('workOrderId');
  const poId = url.searchParams.get('poId');
  const shipmentId = url.searchParams.get('shipmentId');
  const grId = url.searchParams.get('grId');
  const rentalId = url.searchParams.get('rentalId');
  const reportId = url.searchParams.get('reportId');
  const termsId = url.searchParams.get('termsId');
  const complianceId = url.searchParams.get('complianceId');

  // Fetch org data for branding
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select()
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  try {
    switch (type) {
      case 'punch-list':
        return await handlePunchList(supabase, org as Organization, orgId, proposalId);

      case 'load-in-strike':
        return await handleLoadInStrike(supabase, org as Organization, orgId, proposalId);

      case 'crew-call-sheet':
        return await handleCrewCallSheet(supabase, org as Organization, orgId, proposalId, venueId, date);

      case 'wrap-report':
        return await handleWrapReport(supabase, org as Organization, orgId, proposalId);

      case 'proposal':
        return await handleProposal(supabase, org as Organization, orgId, proposalId);

      case 'invoice':
        return await handleInvoice(supabase, org as Organization, orgId, invoiceId);

      case 'terms':
        return await handleTerms(supabase, org as Organization, orgId, termsId);

      case 'change-order':
        return await handleChangeOrder(supabase, org as Organization, orgId, proposalId, url.searchParams.get('changeOrderId'));

      case 'budget-summary':
        return await handleBudgetSummary(supabase, org as Organization, orgId, proposalId);

      case 'credit-note':
        return await handleCreditNote(supabase, org as Organization, orgId, invoiceId);

      case 'production-schedule':
        return await handleProductionSchedule(supabase, org as Organization, orgId, proposalId);

      case 'bom':
        return await handleBom(supabase, org as Organization, orgId, proposalId);

      case 'asset-inventory':
        return await handleAssetInventory(supabase, org as Organization, orgId, proposalId);

      case 'packing-list':
        return await handlePackingList(supabase, org as Organization, orgId, shipmentId);

      case 'purchase-order':
        return await handlePurchaseOrder(supabase, org as Organization, orgId, poId);

      case 'work-order':
        return await handleWorkOrder(supabase, org as Organization, orgId, workOrderId);

      case 'shipment-manifest':
        return await handleShipmentManifest(supabase, org as Organization, orgId, shipmentId);

      case 'goods-receipt':
        return await handleGoodsReceipt(supabase, org as Organization, orgId, grId);

      case 'rental-agreement':
        return await handleRentalAgreement(supabase, org as Organization, orgId, rentalId);

      case 'daily-report':
        return await handleDailyReport(supabase, org as Organization, orgId, reportId);

      case 'expense-report':
        return await handleExpenseReport(supabase, org as Organization, orgId, proposalId, url.searchParams.get('from'), url.searchParams.get('to'));

      case 'compliance-certificate':
        return await handleComplianceCertificate(supabase, org as Organization, orgId, complianceId);

      case 'quote':
        return await handleQuote(supabase, org as Organization, orgId, url);

      case 'payroll-summary':
        return await handlePayrollSummary(supabase, org as Organization, orgId, url.searchParams.get('from'), url.searchParams.get('to'));

      default:
        return NextResponse.json(
          { error: `Document type "${type}" is not yet implemented in this route.` },
          { status: 501 },
        );
    }
  } catch (err) {
    log.error(`[documents/${type}] Generation failed:`, {}, err);
    return NextResponse.json(
      { error: 'Document generation failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Shared data-fetching helpers
// ---------------------------------------------------------------------------

 
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function fetchProposalAndClient(
  supabase: SupabaseClient,
  orgId: string,
  proposalId: string | null,
): Promise<{ proposal: Proposal; client: Client } | NextResponse> {
  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId query parameter is required' }, { status: 400 });
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select()
    .eq('id', proposalId)
    .eq('organization_id', orgId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const { data: client } = await supabase
    .from('clients')
    .select()
    .eq('id', proposal.client_id)
    .eq('organization_id', orgId)
    .single();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return { proposal: proposal as Proposal, client: client as Client };
}

async function fetchVenues(supabase: SupabaseClient, proposalId: string): Promise<Venue[]> {
  const { data } = await supabase
    .from('venues')
    .select()
    .eq('proposal_id', proposalId)
    .order('sequence');
  return (data ?? []) as Venue[];
}

async function fetchPhases(supabase: SupabaseClient, proposalId: string): Promise<Phase[]> {
  const { data } = await supabase
    .from('phases')
    .select()
    .eq('proposal_id', proposalId)
    .order('sort_order');
  return (data ?? []) as Phase[];
}

async function fetchTeamAssignments(
  supabase: SupabaseClient,
  proposalId: string,
): Promise<Array<TeamAssignment & { user: User }>> {
  const { data } = await supabase
    .from('team_assignments')
    .select('*, user:users(*)')
    .eq('proposal_id', proposalId);
  return (data ?? []) as Array<TeamAssignment & { user: User }>;
}

async function fetchMilestones(
  supabase: SupabaseClient,
  phaseIds: string[],
): Promise<Array<MilestoneGate & { requirements: MilestoneRequirement[] }>> {
  if (phaseIds.length === 0) return [];

  const { data: milestones } = await supabase
    .from('milestone_gates')
    .select()
    .in('phase_id', phaseIds);

  const msIds = (milestones ?? []).map((ms: Record<string, unknown>) => ms.id as string);

  let requirements: MilestoneRequirement[] = [];
  if (msIds.length > 0) {
    const { data: reqData } = await supabase
      .from('milestone_requirements')
      .select()
      .in('milestone_id', msIds)
      .order('sort_order');
    requirements = (reqData ?? []) as MilestoneRequirement[];
  }

  // Map requirements to milestones
  const reqByMilestone = new Map<string, MilestoneRequirement[]>();
  for (const req of requirements) {
    const list = reqByMilestone.get(req.milestone_id) ?? [];
    list.push(req);
    reqByMilestone.set(req.milestone_id, list);
  }

  return (milestones ?? []).map((ms) => ({
    ...(ms as MilestoneGate),
    requirements: reqByMilestone.get((ms as MilestoneGate).id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Document-specific handlers — Original 4
// ---------------------------------------------------------------------------

async function handlePunchList(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  const result = await fetchProposalAndClient(supabase, orgId, proposalId);
  if (result instanceof NextResponse) return result;
  const { proposal, client } = result;

  const [venues, phases] = await Promise.all([
    fetchVenues(supabase, proposal.id),
    fetchPhases(supabase, proposal.id),
  ]);

  const phaseIds = phases.map((p) => p.id);
  const milestones = await fetchMilestones(supabase, phaseIds);

  const buffer = await generatePunchList({
    org,
    proposal,
    client,
    venues,
    milestones,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `punch-list-${slug}.docx`);
}

async function handleLoadInStrike(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  const result = await fetchProposalAndClient(supabase, orgId, proposalId);
  if (result instanceof NextResponse) return result;
  const { proposal, client } = result;

  const [venues, teamAssignments, phases] = await Promise.all([
    fetchVenues(supabase, proposal.id),
    fetchTeamAssignments(supabase, proposal.id),
    fetchPhases(supabase, proposal.id),
  ]);

  const buffer = await generateLoadInStrike({
    org,
    proposal,
    client,
    venues,
    teamAssignments,
    phases,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `load-in-strike-${slug}.docx`);
}

async function handleCrewCallSheet(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
  venueId: string | null,
  date: string | null,
): Promise<NextResponse> {
  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId query parameter is required' }, { status: 400 });
  }
  if (!venueId) {
    return NextResponse.json({ error: 'venueId query parameter is required' }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: 'date query parameter is required (YYYY-MM-DD)' }, { status: 400 });
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select()
    .eq('id', proposalId)
    .eq('organization_id', orgId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const { data: venue } = await supabase
    .from('venues')
    .select()
    .eq('id', venueId)
    .eq('proposal_id', proposalId)
    .single();

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const teamAssignments = await fetchTeamAssignments(supabase, proposalId);

  const buffer = await generateCrewCallSheet({
    org,
    proposal: proposal as Proposal,
    venue: venue as Venue,
    teamAssignments,
    date,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `crew-call-sheet-${slug}-${date}.docx`);
}

async function handleWrapReport(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  const result = await fetchProposalAndClient(supabase, orgId, proposalId);
  if (result instanceof NextResponse) return result;
  const { proposal, client } = result;

  const [phases, venues, assets, invoices, changeOrders] = await Promise.all([
    fetchPhases(supabase, proposal.id),
    fetchVenues(supabase, proposal.id),
    (async () => {
      const { data } = await supabase
        .from('assets')
        .select()
        .eq('proposal_id', proposal.id)
        .eq('organization_id', orgId);
      return (data ?? []) as Asset[];
    })(),
    (async () => {
      const { data } = await supabase
        .from('invoices')
        .select()
        .eq('proposal_id', proposal.id)
        .eq('organization_id', orgId);
      return (data ?? []) as Invoice[];
    })(),
    (async () => {
      const { data } = await supabase
        .from('change_orders')
        .select()
        .eq('proposal_id', proposal.id)
        .eq('organization_id', orgId);
      return (data ?? []) as ChangeOrder[];
    })(),
  ]);

  const buffer = await generateWrapReport({
    org,
    proposal,
    client,
    phases,
    venues,
    assets,
    invoices,
    changeOrders,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `wrap-report-${slug}.docx`);
}

// ---------------------------------------------------------------------------
// Document-specific handlers — Phase 2: Financial
// ---------------------------------------------------------------------------

async function handleProposal(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  const result = await fetchProposalAndClient(supabase, orgId, proposalId);
  if (result instanceof NextResponse) return result;
  const { proposal, client } = result;

  const [phases, venues] = await Promise.all([
    fetchPhases(supabase, proposal.id),
    fetchVenues(supabase, proposal.id),
  ]);

  const phaseIds = phases.map((p) => p.id);

  // Fetch deliverables per phase
  const deliverablesByPhase = new Map<string, Array<{ name: string; qty: number; unit_cost: number; total_cost: number; category: string | null; description: string | null }>>();
  if (phaseIds.length > 0) {
    const { data: deliverables } = await supabase
      .from('phase_deliverables')
      .select()
      .in('phase_id', phaseIds);
    for (const d of (deliverables ?? []) as Record<string, unknown>[]) {
      const pid = d.phase_id as string;
      const list = deliverablesByPhase.get(pid) ?? [];
      list.push({
        name: (d.name as string) ?? '',
        qty: (d.quantity as number) ?? 1,
        unit_cost: (d.unit_cost as number) ?? 0,
        total_cost: (d.total_cost as number) ?? 0,
        category: (d.category as string) ?? null,
        description: (d.description as string) ?? null,
      });
      deliverablesByPhase.set(pid, list);
    }
  }

  // Fetch addons per phase
  const addonsByPhase = new Map<string, Array<{ name: string; qty: number; unit_cost: number; total_cost: number; selected: boolean; description: string | null }>>();
  if (phaseIds.length > 0) {
    const { data: addons } = await supabase
      .from('phase_addons')
      .select()
      .in('phase_id', phaseIds);
    for (const a of (addons ?? []) as Record<string, unknown>[]) {
      const pid = a.phase_id as string;
      const list = addonsByPhase.get(pid) ?? [];
      list.push({
        name: (a.name as string) ?? '',
        qty: (a.quantity as number) ?? 1,
        unit_cost: (a.unit_cost as number) ?? 0,
        total_cost: (a.total_cost as number) ?? 0,
        selected: (a.is_selected as boolean) ?? false,
        description: (a.description as string) ?? null,
      });
      addonsByPhase.set(pid, list);
    }
  }

  // Fetch milestones
  const milestones = await fetchMilestones(supabase, phaseIds);
  const milestonesByPhase = new Map<string, Array<MilestoneGate & { requirements: MilestoneRequirement[] }>>();
  for (const ms of milestones) {
    const pid = ms.phase_id;
    const list = milestonesByPhase.get(pid) ?? [];
    list.push(ms);
    milestonesByPhase.set(pid, list);
  }

  // Fetch terms document if linked
  let termsDocument: TermsDocument | null = null;
  if (proposal.terms_document_id) {
    const { data: td } = await supabase
      .from('terms_documents')
      .select()
      .eq('id', proposal.terms_document_id)
      .single();
    termsDocument = (td as TermsDocument) ?? null;
  }

  const buffer = await generateProposal({
    org,
    proposal,
    client,
    phases,
    deliverablesByPhase,
    addonsByPhase,
    milestonesByPhase,
    venues,
    termsDocument,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `proposal-${slug}.docx`);
}

async function handleInvoice(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  invoiceId: string | null,
): Promise<NextResponse> {
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId query parameter is required' }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const client = castRelation<Client>(invoice.clients);
  if (!client) {
    return NextResponse.json({ error: 'Client not found for invoice' }, { status: 404 });
  }

  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select()
    .eq('invoice_id', invoiceId)
    .order('sort_order');

  const buffer = await generateInvoice({
    org,
    invoice: invoice as unknown as Invoice,
    lineItems: (lineItems ?? []) as InvoiceLineItem[],
    client,
  });

  return docxResponse(buffer, `invoice-${invoice.invoice_number ?? invoiceId}.docx`);
}

async function handleTerms(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  termsId: string | null,
): Promise<NextResponse> {
  if (!termsId) {
    return NextResponse.json({ error: 'termsId query parameter is required' }, { status: 400 });
  }

  const { data: td } = await supabase
    .from('terms_documents')
    .select()
    .eq('id', termsId)
    .eq('organization_id', orgId)
    .single();

  if (!td) {
    return NextResponse.json({ error: 'Terms document not found' }, { status: 404 });
  }

  const buffer = await generateTerms({
    org,
    termsDocument: td as TermsDocument,
  });

  const slug = (td.title as string).replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `terms-${slug}.docx`);
}

async function handleChangeOrder(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
  changeOrderId: string | null,
): Promise<NextResponse> {
  if (!changeOrderId) {
    return NextResponse.json({ error: 'changeOrderId query parameter is required' }, { status: 400 });
  }

  const { data: co } = await supabase
    .from('change_orders')
    .select()
    .eq('id', changeOrderId)
    .eq('organization_id', orgId)
    .single();

  if (!co) {
    return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
  }

  const coProposalId = (co.proposal_id as string) ?? proposalId;
  const result = await fetchProposalAndClient(supabase, orgId, coProposalId);
  if (result instanceof NextResponse) return result;
  const { proposal, client } = result;

  const buffer = await generateChangeOrder({
    org,
    proposal,
    client,
    changeOrder: co as ChangeOrder,
  });

  return docxResponse(buffer, `change-order-${co.number ?? changeOrderId}.docx`);
}

async function handleBudgetSummary(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  const result = await fetchProposalAndClient(supabase, orgId, proposalId);
  if (result instanceof NextResponse) return result;
  const { proposal } = result;

  const [phases, invoices, changeOrders] = await Promise.all([
    fetchPhases(supabase, proposal.id),
    (async () => {
      const { data } = await supabase.from('invoices').select().eq('proposal_id', proposal.id).eq('organization_id', orgId);
      return (data ?? []) as Invoice[];
    })(),
    (async () => {
      const { data } = await supabase.from('change_orders').select().eq('proposal_id', proposal.id).eq('organization_id', orgId);
      return (data ?? []) as ChangeOrder[];
    })(),
  ]);

  // Fetch expenses for this proposal
  const { data: expenseData } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('proposal_id', proposal.id)
    .eq('organization_id', orgId);

  const expenses = (expenseData ?? []).map((e: Record<string, unknown>) => ({
    category: (e.category as string) ?? 'Uncategorized',
    amount: (e.amount as number) ?? 0,
  }));

  const buffer = await generateBudgetSummary({
    org,
    proposal,
    phases,
    invoices,
    changeOrders,
    expenses,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `budget-summary-${slug}.docx`);
}

async function handleCreditNote(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  invoiceId: string | null,
): Promise<NextResponse> {
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId query parameter is required (original invoice)' }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const client = castRelation<Client>(invoice.clients);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select()
    .eq('invoice_id', invoiceId)
    .order('sort_order');

  const items = (lineItems ?? []) as InvoiceLineItem[];
  const subtotal = items.reduce((sum, li) => sum + ((li.amount as number) ?? 0), 0);
  const taxAmount = items.reduce((sum, li) => sum + ((li.tax_amount as number) ?? 0), 0);
  const total = subtotal + taxAmount;

  const buffer = await generateCreditNote({
    org,
    client,
    creditNote: {
      credit_note_number: `CN-${invoice.invoice_number ?? invoiceId.slice(0, 8)}`,
      invoice_number: (invoice.invoice_number as string) ?? '',
      issue_date: new Date().toISOString(),
      reason: null,
      status: 'draft',
      line_items: items.map((li) => ({
        description: (li.description as string) ?? '',
        quantity: (li.quantity as number) ?? 1,
        rate: (li.rate as number) ?? 0,
        amount: (li.amount as number) ?? 0,
      })),
      subtotal,
      tax_amount: taxAmount,
      total,
      original_invoice_total: (invoice.total as number) ?? 0,
      remaining_balance: ((invoice.total as number) ?? 0) - total,
    },
  });

  return docxResponse(buffer, `credit-note-${invoice.invoice_number ?? invoiceId}.docx`);
}

// ---------------------------------------------------------------------------
// Document-specific handlers — Phase 3: Operations
// ---------------------------------------------------------------------------

async function handleProductionSchedule(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId query parameter is required' }, { status: 400 });
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select()
    .eq('id', proposalId)
    .eq('organization_id', orgId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const [phases, venues, teamAssignments] = await Promise.all([
    fetchPhases(supabase, proposalId),
    fetchVenues(supabase, proposalId),
    fetchTeamAssignments(supabase, proposalId),
  ]);

  const buffer = await generateProductionSchedule({
    org,
    proposal: proposal as Proposal,
    phases,
    venues,
    teamAssignments,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `production-schedule-${slug}.docx`);
}

async function handleBom(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  const result = await fetchProposalAndClient(supabase, orgId, proposalId);
  if (result instanceof NextResponse) return result;
  const { proposal } = result;

  const phases = await fetchPhases(supabase, proposal.id);
  const phaseIds = phases.map((p) => p.id);

  const itemsByPhase = new Map<string, Array<{ name: string; category: string | null; qty: number; unit_cost: number; total_cost: number; description: string | null; dimensions?: string | null; weight?: number | null; material?: string | null }>>();

  if (phaseIds.length > 0) {
    const { data: deliverables } = await supabase
      .from('phase_deliverables')
      .select()
      .in('phase_id', phaseIds);

    for (const d of (deliverables ?? []) as Record<string, unknown>[]) {
      const pid = d.phase_id as string;
      const list = itemsByPhase.get(pid) ?? [];
      list.push({
        name: (d.name as string) ?? '',
        category: (d.category as string) ?? null,
        qty: (d.quantity as number) ?? 1,
        unit_cost: (d.unit_cost as number) ?? 0,
        total_cost: (d.total_cost as number) ?? 0,
        description: (d.description as string) ?? null,
      });
      itemsByPhase.set(pid, list);
    }
  }

  const buffer = await generateBom({
    org,
    proposal,
    phases,
    itemsByPhase,
  });

  const slug = proposal.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  return docxResponse(buffer, `bom-${slug}.docx`);
}

async function handleAssetInventory(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
): Promise<NextResponse> {
  let query = supabase.from('assets').select().eq('organization_id', orgId);
  if (proposalId) query = query.eq('proposal_id', proposalId);

  const { data } = await query;

  const buffer = await generateAssetInventory({
    org,
    assets: (data ?? []) as Asset[],
    scopeLabel: proposalId ? 'Project-scoped' : 'Organization-wide',
  });

  return docxResponse(buffer, `asset-inventory-${orgId.slice(0, 8)}.docx`);
}

async function handlePackingList(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  shipmentId: string | null,
): Promise<NextResponse> {
  if (!shipmentId) {
    return NextResponse.json({ error: 'shipmentId query parameter is required' }, { status: 400 });
  }

  const { data: shipment } = await supabase
    .from('shipments')
    .select('*, events(name), clients(company_name)')
    .eq('id', shipmentId)
    .eq('organization_id', orgId)
    .single();

  if (!shipment) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }

  const { data: lineItems } = await supabase
    .from('shipment_line_items')
    .select()
    .eq('shipment_id', shipmentId);

  const buffer = await generatePackingList({
    org,
    shipment: {
      shipment_number: (shipment.shipment_number as string) ?? '',
      direction: (shipment.direction as string) ?? 'outbound',
      carrier: (shipment.carrier as string) ?? null,
      tracking_number: (shipment.tracking_number as string) ?? null,
      origin_address: (shipment.origin_address as string) ?? null,
      destination_address: (shipment.destination_address as string) ?? null,
      ship_date: (shipment.ship_date as string) ?? null,
      estimated_arrival: (shipment.estimated_arrival as string) ?? null,
      weight_lbs: (shipment.weight_lbs as number) ?? null,
      num_pieces: (shipment.num_pieces as number) ?? 0,
      notes: (shipment.notes as string) ?? null,
    },
    lineItems: ((lineItems ?? []) as Record<string, unknown>[]).map((li) => ({
      name: (li.item_name as string) ?? (li.name as string) ?? '',
      quantity: (li.quantity as number) ?? 1,
      weight_lbs: (li.weight_lbs as number) ?? null,
      dimensions: (li.dimensions as string) ?? null,
      notes: (li.notes as string) ?? null,
    })),
    eventName: castRelation<{ name: string }>(shipment.events)?.name,
    clientName: castRelation<{ company_name: string }>(shipment.clients)?.company_name,
  });

  return docxResponse(buffer, `packing-list-${shipment.shipment_number ?? shipmentId}.docx`);
}

// ---------------------------------------------------------------------------
// Document-specific handlers — Phase 4: Procurement
// ---------------------------------------------------------------------------

async function handlePurchaseOrder(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  poId: string | null,
): Promise<NextResponse> {
  if (!poId) {
    return NextResponse.json({ error: 'poId query parameter is required' }, { status: 400 });
  }

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*, vendors(*)')
    .eq('id', poId)
    .eq('organization_id', orgId)
    .single();

  if (!po) {
    return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
  }

  const vendor = castRelation<Record<string, unknown>>(po.vendors);

  const { data: lineItems } = await supabase
    .from('purchase_order_line_items')
    .select()
    .eq('purchase_order_id', poId);

  const items = ((lineItems ?? []) as Record<string, unknown>[]).map((li) => ({
    description: (li.description as string) ?? '',
    quantity: (li.quantity as number) ?? 1,
    unit_price: (li.unit_price as number) ?? 0,
    total: (li.total as number) ?? ((li.quantity as number) ?? 1) * ((li.unit_price as number) ?? 0),
  }));

  const subtotal = items.reduce((sum, li) => sum + li.total, 0);

  const buffer = await generatePurchaseOrder({
    org,
    purchaseOrder: {
      po_number: (po.po_number as string) ?? '',
      status: (po.status as string) ?? 'draft',
      order_date: (po.order_date as string) ?? (po.created_at as string),
      expected_delivery: (po.expected_delivery as string) ?? null,
      shipping_method: (po.shipping_method as string) ?? null,
      notes: (po.notes as string) ?? null,
      subtotal,
      tax_amount: (po.tax_amount as number) ?? 0,
      shipping_cost: (po.shipping_cost as number) ?? 0,
      total: (po.total as number) ?? subtotal,
    },
    vendor: {
      name: (vendor?.name as string) ?? 'Unknown Vendor',
      contact_name: (vendor?.contact_name as string) ?? null,
      email: (vendor?.email as string) ?? null,
      phone: (vendor?.phone as string) ?? null,
      address: (vendor?.address as string) ?? null,
    },
    lineItems: items,
  });

  return docxResponse(buffer, `po-${po.po_number ?? poId}.docx`);
}

async function handleWorkOrder(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  workOrderId: string | null,
): Promise<NextResponse> {
  if (!workOrderId) {
    return NextResponse.json({ error: 'workOrderId query parameter is required' }, { status: 400 });
  }

  const { data: wo } = await supabase
    .from('work_orders')
    .select('*, work_order_assignments(*, crew_profiles(id, full_name))')
    .eq('id', workOrderId)
    .eq('organization_id', orgId)
    .single();

  if (!wo) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  // Fetch project name if linked
  let projectName: string | undefined;
  if (wo.proposal_id) {
    const { data: prop } = await supabase
      .from('proposals')
      .select('name')
      .eq('id', wo.proposal_id as string)
      .single();
    projectName = (prop?.name as string) ?? undefined;
  }

  const assignments = ((wo.work_order_assignments ?? []) as Record<string, unknown>[]).map((a) => {
    const crew = castRelation<{ full_name: string }>(a.crew_profiles);
    return {
      name: crew?.full_name ?? 'Unknown',
      role: (a.role as string) ?? undefined,
    };
  });

  const checklist = ((wo.checklist ?? []) as Array<{ label: string; checked?: boolean }>);

  const buffer = await generateWorkOrder({
    org,
    workOrder: {
      wo_number: (wo.wo_number as string) ?? '',
      title: (wo.title as string) ?? '',
      description: (wo.description as string) ?? null,
      priority: (wo.priority as string) ?? 'medium',
      status: (wo.status as string) ?? 'draft',
      location_name: (wo.location_name as string) ?? null,
      location_address: (wo.location_address as string) ?? null,
      scheduled_start: (wo.scheduled_start as string) ?? null,
      scheduled_end: (wo.scheduled_end as string) ?? null,
      checklist,
    },
    assignedCrew: assignments,
    projectName,
  });

  return docxResponse(buffer, `work-order-${wo.wo_number ?? workOrderId}.docx`);
}

async function handleShipmentManifest(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  shipmentId: string | null,
): Promise<NextResponse> {
  if (!shipmentId) {
    return NextResponse.json({ error: 'shipmentId query parameter is required' }, { status: 400 });
  }

  const { data: shipment } = await supabase
    .from('shipments')
    .select('*, events(name), vendors(name), clients(company_name)')
    .eq('id', shipmentId)
    .eq('organization_id', orgId)
    .single();

  if (!shipment) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }

  const { data: lineItems } = await supabase
    .from('shipment_line_items')
    .select()
    .eq('shipment_id', shipmentId);

  const buffer = await generateShipmentManifest({
    org,
    shipment: {
      shipment_number: (shipment.shipment_number as string) ?? '',
      direction: (shipment.direction as string) ?? 'outbound',
      carrier: (shipment.carrier as string) ?? null,
      tracking_number: (shipment.tracking_number as string) ?? null,
      origin_address: (shipment.origin_address as string) ?? null,
      destination_address: (shipment.destination_address as string) ?? null,
      ship_date: (shipment.ship_date as string) ?? null,
      estimated_arrival: (shipment.estimated_arrival as string) ?? null,
      weight_lbs: (shipment.weight_lbs as number) ?? null,
      num_pieces: (shipment.num_pieces as number) ?? 0,
      shipping_cost_cents: (shipment.shipping_cost_cents as number) ?? 0,
      notes: (shipment.notes as string) ?? null,
    },
    lineItems: ((lineItems ?? []) as Record<string, unknown>[]).map((li) => ({
      name: (li.item_name as string) ?? (li.name as string) ?? '',
      quantity: (li.quantity as number) ?? 1,
      weight_lbs: (li.weight_lbs as number) ?? null,
      notes: (li.notes as string) ?? null,
    })),
    eventName: castRelation<{ name: string }>(shipment.events)?.name,
    vendorName: castRelation<{ name: string }>(shipment.vendors)?.name,
    clientName: castRelation<{ company_name: string }>(shipment.clients)?.company_name,
  });

  return docxResponse(buffer, `manifest-${shipment.shipment_number ?? shipmentId}.docx`);
}

async function handleGoodsReceipt(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  grId: string | null,
): Promise<NextResponse> {
  if (!grId) {
    return NextResponse.json({ error: 'grId query parameter is required' }, { status: 400 });
  }

  const { data: gr } = await supabase
    .from('goods_receipts')
    .select('*, purchase_orders(po_number), vendors(name, contact_name)')
    .eq('id', grId)
    .eq('organization_id', orgId)
    .single();

  if (!gr) {
    return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 });
  }

  const po = castRelation<{ po_number: string }>(gr.purchase_orders);
  const vendor = castRelation<{ name: string; contact_name: string | null }>(gr.vendors);

  const { data: lineItems } = await supabase
    .from('goods_receipt_line_items')
    .select()
    .eq('goods_receipt_id', grId);

  const buffer = await generateGoodsReceipt({
    org,
    receipt: {
      gr_number: (gr.gr_number as string) ?? '',
      po_number: po?.po_number ?? '',
      received_date: (gr.received_date as string) ?? (gr.created_at as string),
      status: (gr.status as string) ?? 'draft',
      notes: (gr.notes as string) ?? null,
    },
    vendor: {
      name: vendor?.name ?? 'Unknown Vendor',
      contact_name: vendor?.contact_name ?? null,
    },
    lineItems: ((lineItems ?? []) as Record<string, unknown>[]).map((li) => ({
      description: (li.description as string) ?? '',
      ordered_qty: (li.ordered_qty as number) ?? 0,
      received_qty: (li.received_qty as number) ?? 0,
      condition: (li.condition as string) ?? 'good',
      notes: (li.notes as string) ?? null,
    })),
  });

  return docxResponse(buffer, `goods-receipt-${gr.gr_number ?? grId}.docx`);
}

async function handleRentalAgreement(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  rentalId: string | null,
): Promise<NextResponse> {
  if (!rentalId) {
    return NextResponse.json({ error: 'rentalId query parameter is required' }, { status: 400 });
  }

  const { data: rental } = await supabase
    .from('rental_orders')
    .select('*, clients(*)')
    .eq('id', rentalId)
    .eq('organization_id', orgId)
    .single();

  if (!rental) {
    return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
  }

  const client = castRelation<Client>(rental.clients);

  const { data: lineItems } = await supabase
    .from('rental_order_line_items')
    .select()
    .eq('rental_order_id', rentalId);

  const items = ((lineItems ?? []) as Record<string, unknown>[]).map((li) => ({
    name: (li.name as string) ?? (li.item_name as string) ?? '',
    daily_rate: (li.daily_rate as number) ?? 0,
    rental_days: (li.rental_days as number) ?? 1,
    quantity: (li.quantity as number) ?? 1,
    total: (li.total as number) ?? ((li.daily_rate as number) ?? 0) * ((li.rental_days as number) ?? 1) * ((li.quantity as number) ?? 1),
  }));

  const subtotal = items.reduce((sum, li) => sum + li.total, 0);

  const buffer = await generateRentalAgreement({
    org,
    rental: {
      order_number: (rental.order_number as string) ?? '',
      status: (rental.status as string) ?? 'draft',
      start_date: (rental.start_date as string) ?? null,
      end_date: (rental.end_date as string) ?? null,
      delivery_date: (rental.delivery_date as string) ?? null,
      pickup_date: (rental.pickup_date as string) ?? null,
      deposit_amount: (rental.deposit_amount as number) ?? 0,
      subtotal,
      tax_amount: (rental.tax_amount as number) ?? 0,
      total: (rental.total as number) ?? subtotal,
      notes: (rental.notes as string) ?? null,
    },
    client: {
      name: client?.company_name ?? 'Client',
      company: client?.company_name ?? null,
      email: (client as Record<string, unknown>)?.email as string ?? null,
      phone: (client as Record<string, unknown>)?.phone as string ?? null,
      address: null,
    },
    lineItems: items,
  });

  return docxResponse(buffer, `rental-agreement-${rental.order_number ?? rentalId}.docx`);
}

// ---------------------------------------------------------------------------
// Document-specific handlers — Phase 5: Reporting
// ---------------------------------------------------------------------------

async function handleDailyReport(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  reportId: string | null,
): Promise<NextResponse> {
  if (!reportId) {
    return NextResponse.json({ error: 'reportId query parameter is required' }, { status: 400 });
  }

  const { data: report } = await supabase
    .from('daily_reports')
    .select('*, events(name), users!daily_reports_filed_by_fkey(full_name)')
    .eq('id', reportId)
    .eq('organization_id', orgId)
    .single();

  if (!report) {
    return NextResponse.json({ error: 'Daily report not found' }, { status: 404 });
  }

  const buffer = await generateDailyReport({
    org,
    report: {
      report_date: (report.report_date as string) ?? '',
      labor_hours: (report.labor_hours as number) ?? 0,
      crew_count: (report.crew_count as number) ?? 0,
      deliveries_received: (report.deliveries_received as number) ?? 0,
      notes: (report.notes as string) ?? null,
      status: (report.status as string) ?? 'draft',
    },
    eventName: castRelation<{ name: string }>(report.events)?.name ?? 'Unknown Event',
    filedByName: castRelation<{ full_name: string }>(report.users)?.full_name ?? 'Unknown',
  });

  return docxResponse(buffer, `daily-report-${report.report_date ?? reportId}.docx`);
}

async function handleExpenseReport(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  proposalId: string | null,
  from: string | null,
  to: string | null,
): Promise<NextResponse> {
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to query parameters are required (YYYY-MM-DD)' }, { status: 400 });
  }

  let query = supabase
    .from('expenses')
    .select('*, users(full_name, email)')
    .eq('organization_id', orgId)
    .gte('expense_date', from)
    .lte('expense_date', to);

  if (proposalId) query = query.eq('proposal_id', proposalId);

  const { data: expenses } = await query;

  // Group by user for name/email
  const first = ((expenses ?? [])[0]) as Record<string, unknown> | undefined;
  const user = castRelation<{ full_name: string; email: string }>(first?.users);

  let projectName: string | undefined;
  if (proposalId) {
    const { data: prop } = await supabase.from('proposals').select('name').eq('id', proposalId).single();
    projectName = (prop?.name as string) ?? undefined;
  }

  const buffer = await generateExpenseReport({
    org,
    report: {
      period_start: from,
      period_end: to,
      status: 'submitted',
    },
    employeeName: user?.full_name ?? 'All Employees',
    employeeEmail: user?.email ?? '',
    projectName,
    expenses: ((expenses ?? []) as Record<string, unknown>[]).map((e) => ({
      date: (e.expense_date as string) ?? '',
      category: (e.category as string) ?? 'Uncategorized',
      description: (e.description as string) ?? '',
      amount: (e.amount as number) ?? 0,
      receipt_attached: !!(e.receipt_url as string),
    })),
  });

  return docxResponse(buffer, `expense-report-${from}-to-${to}.docx`);
}

async function handleComplianceCertificate(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  complianceId: string | null,
): Promise<NextResponse> {
  if (!complianceId) {
    return NextResponse.json({ error: 'complianceId query parameter is required' }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from('compliance_documents')
    .select()
    .eq('id', complianceId)
    .eq('organization_id', orgId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: 'Compliance document not found' }, { status: 404 });
  }

  const buffer = await generateComplianceCertificate({
    org,
    document: {
      document_name: (doc.document_name as string) ?? (doc.name as string) ?? '',
      document_type: (doc.document_type as string) ?? (doc.type as string) ?? '',
      status: (doc.status as string) ?? 'pending',
      issued_to: (doc.issued_to as string) ?? null,
      issued_date: (doc.issued_date as string) ?? (doc.created_at as string),
      expiry_date: (doc.expiry_date as string) ?? null,
      notes: (doc.notes as string) ?? null,
      verified_at: (doc.verified_at as string) ?? null,
    },
  });

  return docxResponse(buffer, `compliance-cert-${complianceId.slice(0, 8)}.docx`);
}

async function handleQuote(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  requestUrl: URL,
): Promise<NextResponse> {
  // Accept catalog item IDs + quantities as JSON in the `items` query param
  const itemsParam = requestUrl.searchParams.get('items');
  const days = parseInt(requestUrl.searchParams.get('days') ?? '1', 10) || 1;
  const clientName = requestUrl.searchParams.get('clientName') ?? undefined;
  const clientEmail = requestUrl.searchParams.get('clientEmail') ?? undefined;
  const projectName = requestUrl.searchParams.get('projectName') ?? undefined;

  if (!itemsParam) {
    return NextResponse.json({ error: 'items query parameter is required (JSON array of {catalog_item_id, quantity})' }, { status: 400 });
  }

  let itemRequests: Array<{ catalog_item_id: string; quantity: number }>;
  try {
    itemRequests = JSON.parse(decodeURIComponent(itemsParam));
  } catch {
    return NextResponse.json({ error: 'Invalid items JSON' }, { status: 400 });
  }

  const itemIds = itemRequests.map((i) => i.catalog_item_id);
  const { data: catalogItems } = await supabase
    .from('advance_catalog_items')
    .select('id, name, rental_rate_daily, msrp_usd')
    .in('id', itemIds);

  const lookup = new Map((catalogItems ?? []).map((ci: Record<string, unknown>) => [ci.id as string, ci]));

  let totalCents = 0;
  const lines = itemRequests.map((req) => {
    const ci = lookup.get(req.catalog_item_id) as Record<string, unknown> | undefined;
    const dailyRate = ci?.rental_rate_daily
      ? (ci.rental_rate_daily as number) * 100
      : ((ci?.msrp_usd as number) ?? 0) * 100 * 0.05;
    const lineTotal = dailyRate * req.quantity * days;
    totalCents += lineTotal;

    return {
      item_name: (ci?.name as string) ?? 'Unknown Item',
      quantity: req.quantity,
      daily_rate_cents: dailyRate,
      days,
      line_total_cents: lineTotal,
    };
  });

  const buffer = await generateQuote({
    org,
    quote: {
      quote_number: `Q-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      days,
      total_cents: totalCents,
    },
    lines,
    clientName,
    clientEmail,
    projectName,
  });

  return docxResponse(buffer, `quote-${Date.now()}.docx`);
}

async function handlePayrollSummary(
  supabase: SupabaseClient,
  org: Organization,
  orgId: string,
  from: string | null,
  to: string | null,
): Promise<NextResponse> {
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to query parameters are required (YYYY-MM-DD)' }, { status: 400 });
  }

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*, user:users(full_name, email), proposal:proposals(name)')
    .eq('organization_id', orgId)
    .gte('start_time', `${from}T00:00:00`)
    .lte('start_time', `${to}T23:59:59`);

  const { data: crewProfiles } = await supabase
    .from('crew_profiles')
    .select('user_id, hourly_rate, day_rate')
    .eq('organization_id', orgId);

  const rateMap = new Map<string, { hourly_rate: number; day_rate: number }>();
  for (const cp of (crewProfiles ?? []) as Record<string, unknown>[]) {
    rateMap.set(cp.user_id as string, {
      hourly_rate: (cp.hourly_rate as number) ?? 0,
      day_rate: (cp.day_rate as number) ?? 0,
    });
  }

  const entries = ((timeEntries ?? []) as Record<string, unknown>[]).map((te) => {
    const user = castRelation<{ full_name: string; email: string }>(te.user);
    const proposal = castRelation<{ name: string }>(te.proposal);
    const rates = rateMap.get(te.user_id as string);
    const hours = (te.duration_minutes as number | null) ? (te.duration_minutes as number) / 60 : 0;
    const rate = rates?.hourly_rate ?? 0;

    return {
      userName: user?.full_name ?? 'Unknown',
      email: user?.email ?? '',
      hours: Math.round(hours * 100) / 100,
      rate,
      rateType: 'hourly',
      total: Math.round(hours * rate * 100) / 100,
      projectName: proposal?.name ?? undefined,
    };
  });

  const buffer = await generatePayrollSummary({
    org,
    period: { start: from, end: to },
    entries,
  });

  return docxResponse(buffer, `payroll-summary-${from}-to-${to}.docx`);
}
