/**
 * Purchase Requisition Document Template
 *
 * Generates a branded purchase requisition with line items,
 * justification, and approval chain.
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

interface PRLineItem {
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_cost: number;
  estimated_total: number;
}

interface PurchaseRequisitionData {
  org: Organization;
  requisition: {
    requisition_number: string;
    requested_date: string;
    needed_by_date: string | null;
    status: string;
    justification: string | null;
  };
  requesterName: string;
  projectName: string | null;
  vendorName: string | null;
  lineItems: PRLineItem[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generatePurchaseRequisition(data: PurchaseRequisitionData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { requisition, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('PURCHASE REQUISITION', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Requisition #', requisition.requisition_number],
    ['Requested By', data.requesterName],
    ['Request Date', formatDate(requisition.requested_date)],
    ['Status', requisition.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  if (requisition.needed_by_date) metaInfo.push(['Needed By', formatDate(requisition.needed_by_date)]);
  if (data.projectName) metaInfo.push(['Project', data.projectName]);
  if (data.vendorName) metaInfo.push(['Preferred Vendor', data.vendorName]);

  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  if (requisition.justification) {
    children.push(heading('Justification', 2));
    children.push(body(requisition.justification));
    children.push(spacer());
  }

  children.push(heading('Requested Items', 2));

  const cols: TableColumn[] = [
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.35) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Unit', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Est. Unit Cost', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Est. Total', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const rows = lineItems.map((i) => [
    i.description,
    String(i.quantity),
    i.unit,
    formatCurrency(i.estimated_unit_cost),
    formatCurrency(i.estimated_total),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  const grandTotal = lineItems.reduce((s, i) => s + i.estimated_total, 0);
  children.push(heading('Total', 2));
  children.push(kvTable([['Estimated Total', formatCurrency(grandTotal)]], brand));
  children.push(spacer());

  children.push(heading('Approval', 2));
  children.push(
    ...signatureBlock(
      [{ role: 'Requested By', name: data.requesterName }, { role: 'Approved By' }],
      brand,
    ),
  );

  const section = buildSection({ brand, children, documentTitle: 'Purchase Requisition' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
