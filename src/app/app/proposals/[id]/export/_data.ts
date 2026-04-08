/**
 * Export Hub data fetching and field mapping constants.
 *
 * Fetches proposal, phases, deliverables, invoices, and assets from Supabase.
 * Falls back to empty/placeholder values when data is unavailable.
 *
 * @module app/proposals/[id]/export/_data
 */

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface ProposalExportData {
  name: string;
  client: string;
  totalValue: number;
  currency: string;
}

interface PhaseExportRow {
  name: string;
  phase_investment: number;
}

interface InvoiceExportRow {
  type: string;
  description: string;
  date: string;
  amount: number;
  status: string;
}

interface AssetExportRow {
  [key: string]: unknown;
  name: string;
  type: string;
  category: string;
  venue: string;
  qty: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Data Fetcher
// ---------------------------------------------------------------------------

export async function getExportData(proposalId: string) {
  const supabase = await createClient();

  // Fetch proposal with client
  const { data: proposal } = await supabase
    .from('proposals')
    .select('name, total_value, currency, client_id, valid_until, status')
    .eq('id', proposalId)
    .single();

  let clientName = 'Client';
  if (proposal?.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', proposal.client_id)
      .single();
    clientName = client?.company_name ?? 'Client';
  }

  const proposalData: ProposalExportData = {
    name: proposal?.name ?? 'Untitled Proposal',
    client: clientName,
    totalValue: proposal?.total_value ?? 0,
    currency: proposal?.currency ?? 'USD',
  };

  // Fetch phases + deliverables
  const { data: phases } = await supabase
    .from('phases')
    .select('id, name, phase_number, phase_investment')
    .eq('proposal_id', proposalId)
    .order('sort_order', { ascending: true });

  const phaseList = (phases ?? []) as PhaseExportRow[];
  const phaseIds = (phases ?? []).map((p) => p.id);

  // Fetch deliverables grouped by phase
  const deliverablesByPhase: Record<string, string[]> = {};
  if (phaseIds.length > 0) {
    const { data: deliverables } = await supabase
      .from('phase_deliverables')
      .select('phase_id, name')
      .in('phase_id', phaseIds)
      .order('sort_order', { ascending: true });

    for (const d of deliverables ?? []) {
      if (!deliverablesByPhase[d.phase_id]) deliverablesByPhase[d.phase_id] = [];
      deliverablesByPhase[d.phase_id].push(d.name);
    }
  }

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, type, status, issue_date, total, memo')
    .eq('proposal_id', proposalId)
    .order('issue_date', { ascending: true });

  const invoiceSchedule: InvoiceExportRow[] = (invoices ?? []).map((inv) => ({
    type: (inv.type as string).charAt(0).toUpperCase() + (inv.type as string).slice(1),
    description: (inv.memo as string) ?? `${inv.type} — ${inv.invoice_number}`,
    date: inv.issue_date,
    amount: inv.total,
    status: (inv.status as string).charAt(0).toUpperCase() + (inv.status as string).slice(1),
  }));

  // Fetch assets
  const { data: assets } = await supabase
    .from('assets')
    .select('name, type, category, status, current_location')
    .eq('proposal_id', proposalId);

  const assetInventory: AssetExportRow[] = (assets ?? []).map((a) => {
    const loc = a.current_location as { name?: string } | null;
    return {
      name: a.name,
      type: a.type,
      category: a.category,
      venue: loc?.name ?? '—',
      qty: 1,
      status: (a.status as string).split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    };
  });

  // Build CRM previews from real data
  const salesforcePreview = {
    Opportunity: {
      Name: proposalData.name,
      AccountId: '(mapped from client_id)',
      Amount: proposalData.totalValue,
      StageName: proposal?.status ?? 'draft',
      CloseDate: proposal?.valid_until ?? '',
      Type: 'New Business',
      Description: `Proposal for ${clientName}`,
      CurrencyIsoCode: proposalData.currency,
    },
    OpportunityLineItems: phaseList.map((p) => ({
      Name: p.name,
      UnitPrice: p.phase_investment,
      Quantity: 1,
    })),
  };

  const hubspotPreview = {
    deal: {
      dealname: proposalData.name,
      amount: proposalData.totalValue,
      pipeline: 'default',
      dealstage: 'presentationscheduled',
      closedate: proposal?.valid_until ?? '',
      deal_currency_code: proposalData.currency,
    },
    associations: {
      company: { id: '(mapped from client_id)' },
      contact: { id: '(mapped from primary contact)' },
    },
  };

  const pipedrivePreview = {
    deal: {
      title: proposalData.name,
      value: proposalData.totalValue,
      currency: proposalData.currency,
      stage_id: 3,
      org_id: '(mapped from client_id)',
      person_id: '(mapped from primary contact)',
      expected_close_date: proposal?.valid_until ?? '',
      visible_to: 3,
    },
  };

  const quickbooksPreview = {
    Invoice: {
      CustomerRef: { name: clientName, value: '(mapped from client_id)' },
      TxnDate: invoiceSchedule[0]?.date ?? '',
      DueDate: '',
      Line: invoiceSchedule.slice(0, 3).map((inv) => ({
        Description: inv.description,
        Amount: inv.amount,
        DetailType: 'SalesItemLineDetail',
      })),
      TotalAmt: invoiceSchedule.reduce((s, inv) => s + inv.amount, 0),
      CurrencyRef: { value: proposalData.currency },
    },
  };

  const xeroPreview = {
    Type: 'ACCREC',
    Contact: { Name: clientName },
    Date: invoiceSchedule[0]?.date ?? '',
    DueDate: '',
    LineItems: phaseList.map((p) => ({
      Description: `${p.name} (deposit)`,
      Quantity: 1,
      UnitAmount: Math.round(p.phase_investment * 0.5),
    })),
    CurrencyCode: proposalData.currency,
    Status: 'DRAFT',
  };

  const freshbooksPreview = {
    invoice: {
      customerid: '(mapped from client_id)',
      create_date: invoiceSchedule[0]?.date ?? '',
      due_date: '',
      lines: phaseList.map((p) => ({
        name: `${p.name} (Deposit)`,
        amount: { amount: (p.phase_investment * 0.5).toFixed(2), code: proposalData.currency },
        qty: 1,
      })),
      currency_code: proposalData.currency,
    },
  };

  // PM previews
  const taskStructure = (phases ?? []).map((p) => ({
    name: p.name,
    subtasks: deliverablesByPhase[p.id] ?? [],
  }));

  const clickupPreview = {
    list: { name: proposalData.name },
    tasks: taskStructure,
  };

  const asanaPreview = {
    project: { name: proposalData.name },
    sections: taskStructure.map((t) => ({
      name: t.name,
      tasks: t.subtasks.map((s: string) => ({ name: s })),
    })),
  };

  const mondayPreview = {
    board: { name: proposalData.name },
    groups: taskStructure.map((t) => ({
      title: t.name,
      items: t.subtasks.map((s: string) => ({ name: s, status: 'Not Started' })),
    })),
  };

  // Venue matrix (simplified — group assets by venue)
  const venueMap = new Map<string, Map<string, number>>();
  for (const asset of assetInventory) {
    if (!venueMap.has(asset.name)) venueMap.set(asset.name, new Map());
    const venues = venueMap.get(asset.name)!;
    venues.set(asset.venue, (venues.get(asset.venue) ?? 0) + asset.qty);
  }

  const venueNames = [...new Set(assetInventory.map((a) => a.venue))].slice(0, 2);
  const venueMatrix = [...venueMap.entries()].map(([asset, venues]) => ({
    asset,
    venueA: venues.get(venueNames[0] ?? '') ?? 0,
    venueB: venues.get(venueNames[1] ?? '') ?? 0,
  }));

  // Personnel and equipment are still static export templates
  const personnelTable = [
    { role: 'Project Manager', phase1: 1, phase2: 1, phase3: 1, phase4: 1, totalHours: 320 },
    { role: 'Creative Director', phase1: 1, phase2: 0, phase3: 0, phase4: 0, totalHours: 80 },
    { role: 'Designer', phase1: 2, phase2: 1, phase3: 0, phase4: 0, totalHours: 240 },
    { role: 'Install Lead', phase1: 0, phase2: 0, phase3: 1, phase4: 1, totalHours: 120 },
    { role: 'Install Crew', phase1: 0, phase2: 0, phase3: 4, phase4: 4, totalHours: 320 },
  ];

  const equipmentList = [
    { item: 'Box Truck (26 ft)', qty: 2, phases: 'Phase 3, 4', notes: 'Load-in / strike' },
    { item: 'Scissor Lift', qty: 1, phases: 'Phase 3, 4', notes: 'Install / removal' },
    { item: 'Tool Kit', qty: 3, phases: 'Phase 2, 3, 4', notes: 'Standard toolkit' },
  ];

  const csvFiles = [
    { name: 'line_items', label: 'Line Items', rows: phaseList.length * 5, description: 'All deliverable line items across phases' },
    { name: 'addons', label: 'Add-Ons', rows: 0, description: 'Optional add-on items by phase' },
    { name: 'milestones', label: 'Milestones', rows: phaseList.length, description: 'Milestone gates and requirements' },
    { name: 'contacts', label: 'Contacts', rows: 0, description: 'Client contacts with roles' },
    { name: 'tasks', label: 'Tasks', rows: taskStructure.reduce((s, t) => s + t.subtasks.length, 0), description: 'PM task breakdown' },
    { name: 'assets', label: 'Assets', rows: assetInventory.length, description: 'Full asset inventory' },
  ];

  return {
    proposal: proposalData,
    salesforcePreview,
    hubspotPreview,
    pipedrivePreview,
    quickbooksPreview,
    xeroPreview,
    freshbooksPreview,
    clickupPreview,
    asanaPreview,
    mondayPreview,
    invoiceSchedule,
    assetInventory,
    venueMatrix,
    personnelTable,
    equipmentList,
    csvFiles,
    salesforceMappings,
    hubspotMappings,
    pipedriveMappings,
  };
}

/** The full data payload shape returned by `getExportData`. */
export type ExportHubData = Awaited<ReturnType<typeof getExportData>>;

// ---------------------------------------------------------------------------
// Static field mapping constants (these don't change per proposal)
// ---------------------------------------------------------------------------

export const salesforceMappings = [
  {
    name: 'Deal / Opportunity',
    mappings: [
      { flyteDeckField: 'proposal.name', targetField: 'Opportunity.Name' },
      { flyteDeckField: 'proposal.total_value', targetField: 'Opportunity.Amount' },
      { flyteDeckField: 'proposal.status', targetField: 'Opportunity.StageName' },
      { flyteDeckField: 'proposal.valid_until', targetField: 'Opportunity.CloseDate' },
      { flyteDeckField: 'proposal.currency', targetField: 'Opportunity.CurrencyIsoCode' },
    ],
  },
  {
    name: 'Account / Client',
    mappings: [
      { flyteDeckField: 'client.company_name', targetField: 'Account.Name' },
      { flyteDeckField: 'client.industry', targetField: 'Account.Industry' },
      { flyteDeckField: 'client.billing_address', targetField: 'Account.BillingAddress' },
    ],
  },
  {
    name: 'Line Items',
    mappings: [
      { flyteDeckField: 'deliverable.name', targetField: 'OpportunityLineItem.Name' },
      { flyteDeckField: 'deliverable.total_cost', targetField: 'OpportunityLineItem.UnitPrice' },
      { flyteDeckField: 'deliverable.qty', targetField: 'OpportunityLineItem.Quantity' },
      { flyteDeckField: 'phase.name', targetField: 'OpportunityLineItem.Description' },
    ],
  },
];

export const hubspotMappings = [
  {
    name: 'Deal',
    mappings: [
      { flyteDeckField: 'proposal.name', targetField: 'deal.dealname' },
      { flyteDeckField: 'proposal.total_value', targetField: 'deal.amount' },
      { flyteDeckField: 'proposal.status', targetField: 'deal.dealstage' },
      { flyteDeckField: 'proposal.valid_until', targetField: 'deal.closedate' },
    ],
  },
  {
    name: 'Company',
    mappings: [
      { flyteDeckField: 'client.company_name', targetField: 'company.name' },
      { flyteDeckField: 'client.industry', targetField: 'company.industry' },
    ],
  },
];

export const pipedriveMappings = [
  {
    name: 'Deal',
    mappings: [
      { flyteDeckField: 'proposal.name', targetField: 'deal.title' },
      { flyteDeckField: 'proposal.total_value', targetField: 'deal.value' },
      { flyteDeckField: 'proposal.currency', targetField: 'deal.currency' },
      { flyteDeckField: 'proposal.valid_until', targetField: 'deal.expected_close_date' },
    ],
  },
  {
    name: 'Organization',
    mappings: [
      { flyteDeckField: 'client.company_name', targetField: 'organization.name' },
    ],
  },
];
