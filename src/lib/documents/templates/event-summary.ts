/**
 * Event Summary Document Template
 *
 * Generates a branded event summary with venue details, team assignments,
 * timeline, and key operational data.
 */

import type { Organization } from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  dataTable,
  kvTable,
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface TeamMember {
  name: string;
  role: string;
  email: string | null;
}

interface EventPhase {
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface EventSummaryData {
  org: Organization;
  event: {
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
  };
  clientName: string | null;
  venueName: string | null;
  venueAddress: string | null;
  team: TeamMember[];
  phases: EventPhase[];
  revenue: number;
  expenses: number;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateEventSummary(data: EventSummaryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { event, team, phases } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('EVENT SUMMARY', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Event', event.name],
    ['Status', event.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  if (event.start_date && event.end_date) {
    metaInfo.push(['Dates', `${formatDate(event.start_date)} \u2013 ${formatDate(event.end_date)}`]);
  }
  if (data.clientName) metaInfo.push(['Client', data.clientName]);
  if (data.venueName) metaInfo.push(['Venue', data.venueName]);
  if (data.venueAddress) metaInfo.push(['Address', data.venueAddress]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // Team
  if (team.length > 0) {
    children.push(heading('Team', 2));
    const teamCols: TableColumn[] = [
      { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.35) },
      { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Email', width: Math.floor(CONTENT_WIDTH * 0.35) },
    ];
    const teamRows = team.map((t) => [
      t.name,
      t.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      t.email ?? '\u2014',
    ]);
    children.push(dataTable(teamCols, teamRows, brand));
    children.push(spacer());
  }

  // Phases
  if (phases.length > 0) {
    children.push(heading('Project Phases', 2));
    const phaseCols: TableColumn[] = [
      { header: 'Phase', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Start', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'End', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.3) },
    ];
    const phaseRows = phases.map((p) => [
      p.name,
      p.start_date ? formatDate(p.start_date) : '\u2014',
      p.end_date ? formatDate(p.end_date) : '\u2014',
      p.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    ]);
    children.push(dataTable(phaseCols, phaseRows, brand));
    children.push(spacer());
  }

  // Financials
  const margin = data.revenue - data.expenses;
  const marginPct = data.revenue > 0 ? ((margin / data.revenue) * 100).toFixed(1) : '\u2014';

  children.push(heading('Financial Summary', 2));
  children.push(kvTable([
    ['Revenue', formatCurrency(data.revenue)],
    ['Expenses', formatCurrency(data.expenses)],
    ['Margin', formatCurrency(margin)],
    ['Margin %', typeof marginPct === 'string' ? marginPct + '%' : '\u2014'],
  ], brand));
  children.push(spacer());

  children.push(
    body(`Report generated on ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }),
  );

  const section = buildSection({ brand, children, documentTitle: 'Event Summary' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
