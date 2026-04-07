
/**
 * Acceptance Walk-Through & Punch List Document
 *
 * Generates a DOCX punch list with per-venue installation checklists,
 * blank punch list tables for on-site use, and sign-off blocks.
 */

import type {
  Organization,
  Proposal,
  Client,
  Venue,
  MilestoneGate,
  MilestoneRequirement,
} from '@/types/database';

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
  labelValue,
  calloutBox,
  dataTable,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import { castDocAddress, castActivationDates } from '../doc-types';


// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface PunchListData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  venues: Venue[];
  milestones: Array<MilestoneGate & { requirements: MilestoneRequirement[] }>;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAddress(addr: { street?: string; city?: string; state?: string; zip?: string } | null): string {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
}

/**
 * Find installation-phase milestones. We look for milestones whose name
 * contains "install" (case-insensitive) to identify the installation phase.
 */
function getInstallationRequirements(
  milestones: Array<MilestoneGate & { requirements: MilestoneRequirement[] }>,
): MilestoneRequirement[] {
  const installMilestones = milestones.filter(
    (ms) => ms.name.toLowerCase().includes('install'),
  );
  return installMilestones.flatMap((ms) =>
    [...ms.requirements].sort((a, b) => a.sort_order - b.sort_order),
  );
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generatePunchList(data: PunchListData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, venues, milestones } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('ACCEPTANCE WALK-THROUGH & PUNCH LIST', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 80 } }));
  children.push(body(client.company_name, { italic: true, color: brand.secondaryColor, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Project + Client info
  // ------------------------------------------------------------------
  children.push(heading('Project Information', 2));
  children.push(labelValue('Project', proposal.name, brand));
  children.push(labelValue('Client', client.company_name, brand));
  children.push(labelValue('Prepared Date', formatDate(proposal.prepared_date), brand));
  children.push(labelValue('Total Venues', String(venues.length), brand));
  children.push(spacer());

  // Gather installation requirements once
  const installReqs = getInstallationRequirements(milestones);

  // ------------------------------------------------------------------
  // 3. Per-venue sections
  // ------------------------------------------------------------------
  const sortedVenues = [...venues].sort((a, b) => a.sequence - b.sequence);

  for (let vi = 0; vi < sortedVenues.length; vi++) {
    const venue = sortedVenues[vi];

    if (vi > 0) {
      children.push(pageBreak());
    }

    // Venue header
    children.push(heading(`Venue: ${venue.name}`, 2));
    children.push(labelValue('Address', formatAddress(castDocAddress(venue.address)), brand));
    children.push(labelValue('Type', venue.type, brand));

    const actDates = castActivationDates(venue.activation_dates);
    if (actDates) {
      children.push(
        labelValue(
          'Activation Dates',
          `${formatDate(actDates.start ?? '')} \u2013 ${formatDate(actDates.end ?? '')}`,
          brand,
        ),
      );
    }
    children.push(spacer());

    // Installation checklist
    if (installReqs.length > 0) {
      children.push(heading('Installation Checklist', 3));
      for (const req of installReqs) {
        const isChecked = req.status === 'complete' || req.status === 'waived';
        children.push(checkbox(`${req.text} (${req.assignee})`, isChecked));
      }
      children.push(spacer());
    }

    // Punch List table (10 blank rows)
    children.push(heading('Punch List', 3));

    const punchCols: TableColumn[] = [
      { header: 'Item #', width: Math.floor(CONTENT_WIDTH * 0.1) },
      { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.35) },
      { header: 'Priority', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Assigned To', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const punchRows: string[][] = [];
    for (let i = 1; i <= 10; i++) {
      punchRows.push([String(i), '', '', '', '']);
    }

    children.push(dataTable(punchCols, punchRows, brand));
    children.push(spacer());

    // Sign-off block
    children.push(heading('Sign-Off', 3));
    children.push(labelValue('Inspected By', '________________________________', brand));
    children.push(labelValue('Date', '________________________________', brand));
    children.push(spacer(80));
    children.push(
      body('Accepted:  \u2610 Yes    \u2610 No    \u2610 With Exceptions', {
        bold: true,
        size: 22,
        spacing: { after: 200 },
      }),
    );
  }

  // ------------------------------------------------------------------
  // 4. General Notes
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('General Notes', 2));
  children.push(
    calloutBox(
      'Use this section to record any overall observations, follow-up items, or additional notes from the walk-through.',
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

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Punch List',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
