/**
 * Rental Return Report Document Template
 *
 * Generates a branded report of returned rental items with
 * condition assessment and damage notes.
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
  signatureBlock,
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface ReturnLineItem {
  item_name: string;
  quantity_out: number;
  quantity_returned: number;
  condition: string;
  damage_notes: string | null;
  replacement_cost: number | null;
}

interface RentalReturnReportData {
  org: Organization;
  rental: {
    rental_number: string;
    rental_start: string;
    rental_end: string;
    return_date: string;
    status: string;
  };
  clientName: string;
  lineItems: ReturnLineItem[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateRentalReturnReport(data: RentalReturnReportData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { rental, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('RENTAL RETURN REPORT', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Rental #', rental.rental_number],
    ['Client', data.clientName],
    ['Rental Period', `${formatDate(rental.rental_start)} \u2013 ${formatDate(rental.rental_end)}`],
    ['Return Date', formatDate(rental.return_date)],
    ['Status', rental.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  children.push(heading('Returned Items', 2));

  const cols: TableColumn[] = [
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.22) },
    { header: 'Out', width: Math.floor(CONTENT_WIDTH * 0.08) },
    { header: 'Returned', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Condition', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Damage Notes', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Repl. Cost', width: Math.floor(CONTENT_WIDTH * 0.17) },
  ];

  const rows = lineItems.map((i) => [
    i.item_name,
    String(i.quantity_out),
    String(i.quantity_returned),
    i.condition.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    i.damage_notes ?? '\u2014',
    i.replacement_cost ? formatCurrency(i.replacement_cost) : '\u2014',
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  const missing = lineItems.reduce((s, i) => s + Math.max(0, i.quantity_out - i.quantity_returned), 0);
  const damaged = lineItems.filter((i) => i.damage_notes).length;
  const totalRepl = lineItems.reduce((s, i) => s + (i.replacement_cost ?? 0), 0);

  children.push(heading('Summary', 2));
  children.push(kvTable([
    ['Items Missing', String(missing)],
    ['Items Damaged', String(damaged)],
    ['Total Replacement Cost', formatCurrency(totalRepl)],
  ], brand));
  children.push(spacer());

  children.push(heading('Acknowledgment', 2));
  children.push(
    body('Both parties confirm the returned items and condition assessment above.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [{ role: 'Warehouse', name: data.org.name }, { role: 'Client', name: data.clientName }],
      brand,
    ),
  );

  const section = buildSection({ brand, children, documentTitle: 'Rental Return Report' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
