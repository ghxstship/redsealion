/**
 * Maintenance Log Document Template
 *
 * Generates a branded maintenance history log for assets including
 * scheduled and completed maintenance records.
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

interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
  technician: string | null;
  cost: number | null;
  status: string;
}

interface MaintenanceLogData {
  org: Organization;
  asset: {
    name: string;
    serial_number: string | null;
    category: string | null;
    location: string | null;
  };
  records: MaintenanceRecord[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateMaintenanceLog(data: MaintenanceLogData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { asset, records } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('MAINTENANCE LOG', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Asset', asset.name],
    ['Serial #', asset.serial_number ?? '\u2014'],
    ['Category', asset.category ?? '\u2014'],
    ['Location', asset.location ?? '\u2014'],
    ['Total Records', String(records.length)],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  children.push(heading('Maintenance History', 2));

  const cols: TableColumn[] = [
    { header: 'Date', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.28) },
    { header: 'Technician', width: Math.floor(CONTENT_WIDTH * 0.16) },
    { header: 'Cost', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.14) },
  ];

  const rows = records.map((r) => [
    formatDate(r.date),
    r.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    r.description,
    r.technician ?? '\u2014',
    r.cost ? formatCurrency(r.cost) : '\u2014',
    r.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  const totalCost = records.reduce((s, r) => s + (r.cost ?? 0), 0);
  children.push(kvTable([
    ['Total Maintenance Cost', formatCurrency(totalCost)],
    ['Report Generated', formatDate(new Date().toISOString())],
  ], brand));

  const section = buildSection({ brand, children, documentTitle: 'Maintenance Log' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
