/**
 * Safety Briefing Document Template
 *
 * Generates a branded safety briefing document based on organizational
 * compliance documents and safety policies.
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

interface SafetyItem {
  title: string;
  category: string;
  requirement: string;
  status: string;
  expiry_date: string | null;
}

interface SafetyBriefingData {
  org: Organization;
  eventName: string | null;
  venueName: string | null;
  briefingDate: string;
  safetyItems: SafetyItem[];
  emergencyContact: string | null;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateSafetyBriefing(data: SafetyBriefingData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { safetyItems, briefingDate } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('SAFETY BRIEFING', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Organization', data.org.name],
    ['Briefing Date', formatDate(briefingDate)],
  ];
  if (data.eventName) metaInfo.push(['Event', data.eventName]);
  if (data.venueName) metaInfo.push(['Venue', data.venueName]);
  if (data.emergencyContact) metaInfo.push(['Emergency Contact', data.emergencyContact]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  children.push(heading('Safety Requirements', 2));

  const cols: TableColumn[] = [
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Requirement', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Expiry', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const rows = safetyItems.map((s) => [
    s.title,
    s.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    s.requirement,
    s.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    s.expiry_date ? formatDate(s.expiry_date) : 'N/A',
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  const expired = safetyItems.filter((s) => s.expiry_date && new Date(s.expiry_date) < new Date()).length;
  const verified = safetyItems.filter((s) => s.status === 'verified').length;

  children.push(heading('Compliance Summary', 2));
  children.push(kvTable([
    ['Total Items', String(safetyItems.length)],
    ['Verified', String(verified)],
    ['Expired/Overdue', String(expired)],
  ], brand));
  children.push(spacer());

  children.push(
    body('All personnel must acknowledge receipt and understanding of this safety briefing before commencing work.', {
      spacing: { after: 200 },
    }),
  );

  const section = buildSection({ brand, children, documentTitle: 'Safety Briefing' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
