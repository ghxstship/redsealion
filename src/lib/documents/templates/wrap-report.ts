
/**
 * Project Wrap Report Document
 *
 * Generates a comprehensive post-project wrap report with executive summary,
 * phase completion, financial summary, asset disposition, change order log,
 * and project close checklist.
 */

import type {
  Organization,
  Proposal,
  Client,
  Phase,
  Venue,
  Asset,
  Invoice,
  ChangeOrder,
} from '@/types/database';

import { AlignmentType } from 'docx';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  pageBreak,
  checkbox,
  calloutBox,
  dataTable,
  kvTable,
  formatDate,
  formatCurrency,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import { castActivationDates, castChangeOrders, type DocChangeOrder } from '../doc-types';


// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface WrapReportData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  phases: Phase[];
  venues: Venue[];
  assets: Asset[];
  invoices: Invoice[];
  changeOrders: ChangeOrder[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function phaseStatusEmoji(status: string): string {
  switch (status) {
    case 'complete':
    case 'approved':
      return '\u2713';
    case 'in_progress':
    case 'pending_approval':
      return '\u25CF';
    case 'skipped':
      return '\u2014';
    default:
      return '\u25CB';
  }
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateWrapReport(data: WrapReportData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, phases, venues, assets, invoices } = data;
  const docChangeOrders = castChangeOrders(data.changeOrders as unknown[]);
  const currency = proposal.currency ?? 'USD';

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('PROJECT WRAP REPORT', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 80 } }));
  children.push(body(client.company_name, { italic: true, color: brand.secondaryColor, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Executive Summary
  // ------------------------------------------------------------------
  children.push(heading('Executive Summary', 2));

  const summaryPairs: Array<[string, string]> = [
    ['Project Name', proposal.name],
    ['Client', client.company_name],
    ['Total Phases', String(phases.length)],
    ['Total Venues', String(venues.length)],
    ['Total Value', formatCurrency(proposal.total_value, currency)],
    ['Value With Add-Ons', formatCurrency(proposal.total_with_addons, currency)],
  ];

  children.push(kvTable(summaryPairs, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Phase Completion
  // ------------------------------------------------------------------
  children.push(heading('Phase Completion', 2));

  const sortedPhases = [...phases].sort((a, b) => a.sort_order - b.sort_order);

  const phaseCols: TableColumn[] = [
    { header: 'Phase #', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.35) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Investment', width: Math.floor(CONTENT_WIDTH * 0.3), align: AlignmentType.RIGHT },
  ];

  const phaseRows = sortedPhases.map((phase) => [
    phase.phase_number,
    phase.name,
    `${phaseStatusEmoji(phase.status)} ${phase.status.replace(/_/g, ' ')}`,
    formatCurrency(phase.phase_investment, currency),
  ]);

  children.push(dataTable(phaseCols, phaseRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Venue Recap
  // ------------------------------------------------------------------
  children.push(heading('Venue Recap', 2));

  const venueCols: TableColumn[] = [
    { header: 'Venue Name', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Activation Dates', width: Math.floor(CONTENT_WIDTH * 0.6) },
  ];

  const sortedVenues = [...venues].sort((a, b) => a.sequence - b.sequence);

  const venueRows = sortedVenues.map((v) => {
    const act = castActivationDates(v.activation_dates);
    const activationStr = act
      ? `${formatDate(act.start ?? '')} \u2013 ${formatDate(act.end ?? '')}`
      : '\u2014';
    return [v.name, activationStr];
  });

  children.push(dataTable(venueCols, venueRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Financial Summary
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Financial Summary', 2));

  const originalValue = proposal.total_value;
  const coCount = docChangeOrders.length;
  const coNetChange = docChangeOrders.reduce((sum, co) => sum + (co.net_change ?? co.amount ?? 0), 0);
  const finalValue = originalValue + coNetChange;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const outstanding = totalInvoiced - totalPaid;

  const financePairs: Array<[string, string]> = [
    ['Original Value', formatCurrency(originalValue, currency)],
    ['Change Orders', `${coCount} order(s) / Net ${formatCurrency(coNetChange, currency)}`],
    ['Final Value', formatCurrency(finalValue, currency)],
    ['Total Invoiced', formatCurrency(totalInvoiced, currency)],
    ['Total Paid', formatCurrency(totalPaid, currency)],
    ['Outstanding', formatCurrency(outstanding, currency)],
  ];

  children.push(kvTable(financePairs, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Asset Disposition Summary
  // ------------------------------------------------------------------
  children.push(heading('Asset Disposition Summary', 2));

  if (assets.length > 0) {
    // Group by status
    const statusCounts = new Map<string, number>();
    let reusableCount = 0;
    let storedCount = 0;

    for (const asset of assets) {
      statusCounts.set(asset.status, (statusCounts.get(asset.status) ?? 0) + 1);
      if (asset.is_reusable) reusableCount++;
      if (asset.status === 'in_storage') storedCount++;
    }

    const assetPairs: Array<[string, string]> = [
      ['Total Assets', String(assets.length)],
    ];

    for (const [status, count] of statusCounts.entries()) {
      assetPairs.push([status.replace(/_/g, ' '), String(count)]);
    }

    assetPairs.push(['Reusable', String(reusableCount)]);
    assetPairs.push(['In Storage', String(storedCount)]);

    children.push(kvTable(assetPairs, brand));
  } else {
    children.push(body('No assets tracked for this project.', { italic: true }));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Change Order Log
  // ------------------------------------------------------------------
  children.push(heading('Change Order Log', 2));

  if (docChangeOrders.length > 0) {
    const coCols: TableColumn[] = [
      { header: 'CO #', width: Math.floor(CONTENT_WIDTH * 0.1) },
      { header: 'Title', width: Math.floor(CONTENT_WIDTH * 0.35) },
      { header: 'Net Change', width: Math.floor(CONTENT_WIDTH * 0.25), align: AlignmentType.RIGHT },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.3) },
    ];

    const coRows = docChangeOrders.map((co, idx) => [
      String(co.number ?? idx + 1),
      co.title,
      formatCurrency(co.net_change ?? co.amount ?? 0, currency),
      (co.status ?? '').replace(/_/g, ' '),
    ]);

    children.push(dataTable(coCols, coRows, brand));
  } else {
    children.push(body('No change orders recorded.', { italic: true }));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 8. Lessons Learned / Notes
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Lessons Learned / Notes', 2));
  children.push(
    calloutBox(
      'Document key takeaways, process improvements, and lessons learned for future projects.',
      brand,
    ),
  );
  children.push(spacer(400));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 9. Project Close Checklist
  // ------------------------------------------------------------------
  children.push(heading('Project Close Checklist', 2));
  children.push(
    calloutBox('Standard Phase 08 close-out items. Confirm all are addressed before archiving the project.', brand),
  );
  children.push(spacer(80));

  const closeItems = [
    'Final client sign-off obtained',
    'All invoices issued and reconciled',
    'Outstanding payments collected',
    'Change orders finalized and closed',
    'Assets inventoried and dispositioned',
    'Venue strike completed and confirmed',
    'Equipment returned or stored',
    'Subcontractor / vendor payments settled',
    'Project files archived',
    'Post-mortem / lessons learned documented',
    'Client satisfaction survey sent',
    'Warranty / maintenance terms communicated',
  ];

  for (const item of closeItems) {
    children.push(checkbox(item));
  }

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Wrap Report',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
