/**
 * Goods Receipt Document Template
 *
 * Generates a branded goods receipt confirmation with PO reference,
 * received items, variance reporting, and receiver sign-off.
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
  labelValue,
  calloutBox,
  dataTable,
  kvTable,
  signatureBlock,
  styledBox,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface GrLineItem {
  description: string;
  ordered_qty: number;
  received_qty: number;
  condition: string;
  notes: string | null;
}

interface GoodsReceiptData {
  org: Organization;
  receipt: {
    gr_number: string;
    po_number: string;
    received_date: string;
    status: string;
    notes: string | null;
  };
  vendor: {
    name: string;
    contact_name: string | null;
  };
  lineItems: GrLineItem[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateGoodsReceipt(data: GoodsReceiptData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { receipt, vendor, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('GOODS RECEIPT', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Receipt Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['GR Number', receipt.gr_number],
    ['PO Reference', receipt.po_number],
    ['Received Date', formatDate(receipt.received_date)],
    ['Status', receipt.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Vendor
  // ------------------------------------------------------------------
  children.push(heading('Vendor', 2));
  children.push(labelValue('Company', vendor.name, brand));
  if (vendor.contact_name) children.push(labelValue('Contact', vendor.contact_name, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Received Items
  // ------------------------------------------------------------------
  children.push(heading('Received Items', 2));

  const cols: TableColumn[] = [
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Ordered', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Received', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Variance', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Condition', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Notes', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const rows = lineItems.map((li) => {
    const variance = li.received_qty - li.ordered_qty;
    return [
      li.description,
      String(li.ordered_qty),
      String(li.received_qty),
      variance === 0 ? '\u2014' : variance > 0 ? `+${variance}` : String(variance),
      li.condition,
      li.notes ?? '',
    ];
  });

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Discrepancy Summary
  // ------------------------------------------------------------------
  const discrepancies = lineItems.filter((li) => li.received_qty !== li.ordered_qty || li.condition === 'damaged');

  if (discrepancies.length > 0) {
    children.push(
      ...styledBox(
        'Discrepancies Found',
        discrepancies.map((li) => {
          const variance = li.received_qty - li.ordered_qty;
          const parts: string[] = [li.description];
          if (variance !== 0) parts.push(`Qty variance: ${variance > 0 ? '+' : ''}${variance}`);
          if (li.condition === 'damaged') parts.push('Condition: DAMAGED');
          return parts.join(' \u2014 ');
        }),
        'addon',
        brand,
      ),
    );
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Notes
  // ------------------------------------------------------------------
  if (receipt.notes) {
    children.push(heading('Notes', 2));
    children.push(body(receipt.notes, { spacing: { after: 120 } }));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Receiver Sign-Off
  // ------------------------------------------------------------------
  children.push(heading('Receiving Confirmation', 2));
  children.push(
    body('I confirm that the above items have been received and inspected.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [{ role: 'Received By' }],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: `GR ${receipt.gr_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
