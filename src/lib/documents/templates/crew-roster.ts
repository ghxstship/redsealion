/**
 * Crew Roster Document Template
 *
 * Generates a branded crew roster with contact info, roles,
 * skills, and availability status.
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
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface CrewMember {
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  skills: string[];
  availability: string;
  hourly_rate: number | null;
}

interface CrewRosterData {
  org: Organization;
  asOfDate: string;
  crewMembers: CrewMember[];
  filterRole?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateCrewRoster(data: CrewRosterData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { crewMembers, asOfDate } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('CREW ROSTER', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Organization', data.org.name],
    ['As of Date', formatDate(asOfDate)],
    ['Total Crew', String(crewMembers.length)],
    ['Available', String(crewMembers.filter((c) => c.availability === 'available').length)],
  ];
  if (data.filterRole) metaInfo.push(['Role Filter', data.filterRole]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  children.push(heading('Crew Members', 2));

  const cols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Email', width: Math.floor(CONTENT_WIDTH * 0.22) },
    { header: 'Phone', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Skills', width: Math.floor(CONTENT_WIDTH * 0.17) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.13) },
  ];

  const rows = crewMembers.map((c) => [
    c.name,
    c.email,
    c.phone ?? '\u2014',
    c.role?.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()) ?? '\u2014',
    c.skills.length > 0 ? c.skills.join(', ') : '\u2014',
    c.availability.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  children.push(
    body(`Report generated on ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }),
  );

  const section = buildSection({ brand, children, documentTitle: 'Crew Roster' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
