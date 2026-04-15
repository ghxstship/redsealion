/**
 * Equipment Manifest Document Template
 *
 * Generates a branded equipment listing with status, location,
 * and reservation details.
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

interface EquipmentItem {
  name: string;
  category: string;
  serial_number: string | null;
  status: string;
  current_location: string | null;
  condition: string | null;
  acquisition_cost: number | null;
}

interface EquipmentManifestData {
  org: Organization;
  asOfDate: string;
  equipmentItems: EquipmentItem[];
  filterCategory?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateEquipmentManifest(data: EquipmentManifestData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { equipmentItems, asOfDate } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('EQUIPMENT MANIFEST', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Organization', data.org.name],
    ['As of Date', formatDate(asOfDate)],
    ['Total Items', String(equipmentItems.length)],
  ];
  if (data.filterCategory) metaInfo.push(['Category Filter', data.filterCategory]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // Status summary
  const statusMap = new Map<string, number>();
  for (const item of equipmentItems) {
    statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1);
  }

  children.push(heading('Status Summary', 2));
  const statusRows: Array<[string, string]> = Array.from(statusMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => [
      status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      `${count} (${equipmentItems.length > 0 ? ((count / equipmentItems.length) * 100).toFixed(0) : 0}%)`,
    ]);
  children.push(kvTable(statusRows, brand));
  children.push(spacer());

  // Equipment table
  children.push(heading('Equipment Listing', 2));

  const cols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.22) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Serial #', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Location', width: Math.floor(CONTENT_WIDTH * 0.17) },
    { header: 'Condition', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Cost', width: Math.floor(CONTENT_WIDTH * 0.1) },
  ];

  const rows = equipmentItems.map((e) => [
    e.name,
    e.category,
    e.serial_number ?? '\u2014',
    e.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    e.current_location ?? '\u2014',
    e.condition?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '\u2014',
    e.acquisition_cost ? formatCurrency(e.acquisition_cost) : '\u2014',
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  const totalValue = equipmentItems.reduce((s, e) => s + (e.acquisition_cost ?? 0), 0);
  children.push(
    body(`Total acquisition value: ${formatCurrency(totalValue)}. Report generated ${formatDate(new Date().toISOString())}.`, {
      spacing: { after: 200 },
    }),
  );

  const section = buildSection({ brand, children, documentTitle: 'Equipment Manifest' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
