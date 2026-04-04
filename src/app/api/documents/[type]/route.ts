/**
 * Unified Document Generation API Route
 *
 * GET /api/documents/[type]?proposalId=xxx&invoiceId=xxx&venueId=xxx&date=xxx
 *
 * Generates DOCX documents based on document type. Returns binary DOCX as
 * an attachment with appropriate Content-Disposition header.
 */

import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { DOCUMENT_TYPES, type DocumentType } from '@/lib/documents/engine';

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
  Asset,
  ChangeOrder,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Template imports
// ---------------------------------------------------------------------------

import { generatePunchList } from '@/lib/documents/templates/punch-list';
import { generateLoadInStrike } from '@/lib/documents/templates/load-in-strike';
import { generateCrewCallSheet } from '@/lib/documents/templates/crew-call-sheet';
import { generateWrapReport } from '@/lib/documents/templates/wrap-report';

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
  const permResource = type === 'invoice' ? 'invoices' : 'proposals';
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
  const invoiceId = url.searchParams.get('invoiceId');
  const venueId = url.searchParams.get('venueId');
  const date = url.searchParams.get('date');

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// Document-specific handlers
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
