/**
 * Production Schedule Document Template
 *
 * Generates a branded production schedule with event timeline,
 * venue-by-venue schedule grid, phase timeline, and crew assignments.
 */

import type {
  Organization,
  Proposal,
  Phase,
  Venue,
  TeamAssignment,
  User,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  labelValue,
  dataTable,
  kvTable,
  formatDate,
  pageBreak,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import {
  castDocAddress,
  castLoadInStrikeEntry,
  castActivationDates,
} from '../doc-types';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface ProductionScheduleData {
  org: Organization;
  proposal: Proposal;
  phases: Phase[];
  venues: Venue[];
  teamAssignments: Array<TeamAssignment & { user: User }>;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAddress(addr: { street?: string; city?: string; state?: string; zip?: string } | null): string {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateProductionSchedule(data: ProductionScheduleData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, phases, venues, teamAssignments } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('PRODUCTION SCHEDULE', 1));
  children.push(body(proposal.name, { bold: true, size: 26, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Event Overview
  // ------------------------------------------------------------------
  children.push(heading('Event Overview', 2));

  const overview: Array<[string, string]> = [
    ['Project', proposal.name],
    ['Status', (proposal.status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Total Phases', String(phases.length)],
    ['Total Venues', String(venues.length)],
    ['Crew Size', String(teamAssignments.length)],
  ];

  children.push(kvTable(overview, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Venue Schedule Grid
  // ------------------------------------------------------------------
  if (venues.length > 0) {
    children.push(heading('Venue Schedule', 2));

    const venueCols: TableColumn[] = [
      { header: 'Venue', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Address', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Load-In', width: Math.floor(CONTENT_WIDTH * 0.17) },
      { header: 'Activation', width: Math.floor(CONTENT_WIDTH * 0.16) },
      { header: 'Strike', width: Math.floor(CONTENT_WIDTH * 0.17) },
    ];

    const venueRows = venues.map((v) => {
      const loadIn = castLoadInStrikeEntry(v.load_in);
      const strike = castLoadInStrikeEntry(v.strike);
      const actDates = castActivationDates(v.activation_dates);

      return [
        v.name ?? '',
        formatAddress(castDocAddress(v.address)),
        loadIn ? `${formatDate(loadIn.date ?? '')}\n${loadIn.startTime ?? ''}\u2013${loadIn.endTime ?? ''}` : '\u2014',
        actDates ? `${formatDate(actDates.start ?? '')}\n\u2013 ${formatDate(actDates.end ?? '')}` : '\u2014',
        strike ? `${formatDate(strike.date ?? '')}\n${strike.startTime ?? ''}\u2013${strike.endTime ?? ''}` : '\u2014',
      ];
    });

    children.push(dataTable(venueCols, venueRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 4. Phase Timeline
  // ------------------------------------------------------------------
  children.push(heading('Phase Timeline', 2));

  const phaseCols: TableColumn[] = [
    { header: 'Phase', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Duration', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Investment', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Seq', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];

  const phaseRows = phases.map((p, idx) => [
    p.phase_number ?? String(idx + 1).padStart(2, '0'),
    p.name,
    (p.status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    '\u2014',
    `$${(p.phase_investment ?? 0).toLocaleString()}`,
    String(idx + 1),
  ]);

  children.push(dataTable(phaseCols, phaseRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Crew Assignment Matrix
  // ------------------------------------------------------------------
  if (teamAssignments.length > 0) {
    children.push(pageBreak());
    children.push(heading('Crew Assignments', 2));

    const crewCols: TableColumn[] = [
      { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Email', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Phone', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const crewRows = teamAssignments.map((ta) => [
      ta.user.full_name,
      ta.role,
      ta.user.email,
      ta.user.phone ?? '',
    ]);

    children.push(dataTable(crewCols, crewRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Report Footer
  // ------------------------------------------------------------------
  children.push(
    body(`Schedule generated ${formatDate(new Date().toISOString())}`, {
      italic: true,
      size: 18,
      color: 'A1A1AA',
    }),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Production Schedule',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
