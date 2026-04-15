/**
 * Invoice Document Template
 *
 * Branded invoice DOCX with line items, tax computation,
 * payment status, and memo section.
 */

import type {
  Organization,
  Invoice,
  InvoiceLineItem,
  Client,
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
  calloutBox,
  dataTable,
  kvTable,
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import { castDocAddress } from '../doc-types';

import type { AlignmentType } from 'docx';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface InvoiceData {
  org: Organization;
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
  client: Client;
  taxLabel?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateInvoice(data: InvoiceData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { invoice, lineItems, client } = data;
  const taxLabel = data.taxLabel ?? 'Tax';

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('INVOICE', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Invoice metadata
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Invoice Number', invoice.invoice_number ?? ''],
    ['Type', (invoice.type ?? 'standard').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Status', (invoice.status ?? 'draft').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Issue Date', formatDate(invoice.issue_date)],
    ['Due Date', formatDate(invoice.due_date)],
    ['Currency', (invoice.currency as string) ?? 'USD'],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Bill-To
  // ------------------------------------------------------------------
  children.push(heading('Bill To', 2));
  children.push(labelValue('Company', client.company_name ?? '', brand));

  const addr = castDocAddress(client.billing_address);
  if (addr) {
    const addrLine = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ');
    children.push(labelValue('Address', addrLine, brand));
  }

  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Line Items
  // ------------------------------------------------------------------
  children.push(heading('Line Items', 2));

  const hasTax = (invoice.tax_amount ?? 0) > 0;

  const colDefs: TableColumn[] = [
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * (hasTax ? 0.35 : 0.4)) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1), align: 'RIGHT' as unknown as (typeof AlignmentType)[keyof typeof AlignmentType] },
    { header: 'Rate', width: Math.floor(CONTENT_WIDTH * 0.15), align: 'RIGHT' as unknown as (typeof AlignmentType)[keyof typeof AlignmentType] },
  ];

  if (hasTax) {
    colDefs.push({ header: taxLabel, width: Math.floor(CONTENT_WIDTH * 0.1), align: 'RIGHT' as unknown as (typeof AlignmentType)[keyof typeof AlignmentType] });
  }

  colDefs.push({ header: 'Amount', width: Math.floor(CONTENT_WIDTH * (hasTax ? 0.3 : 0.35)), align: 'RIGHT' as unknown as (typeof AlignmentType)[keyof typeof AlignmentType] });

  const rows = lineItems.map((li) => {
    const row = [
      li.description ?? '',
      String(li.quantity ?? 1),
      formatCurrency(li.rate ?? 0),
    ];
    if (hasTax) {
      row.push(li.tax_rate ? `${li.tax_rate}%` : '\u2014');
    }
    row.push(formatCurrency((li.amount ?? 0) + (li.tax_amount ?? 0)));
    return row;
  });

  children.push(dataTable(colDefs, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 5. Totals
  // ------------------------------------------------------------------
  children.push(heading('Summary', 2));

  const totals: Array<[string, string]> = [
    ['Subtotal', formatCurrency(invoice.subtotal ?? 0)],
  ];

  if (hasTax) {
    totals.push([taxLabel, formatCurrency(invoice.tax_amount ?? 0)]);
  }

  totals.push(['Total', formatCurrency(invoice.total ?? 0)]);

  if ((invoice.amount_paid ?? 0) > 0) {
    totals.push(['Amount Paid', `\u2212 ${formatCurrency(invoice.amount_paid ?? 0)}`]);
    totals.push(['Balance Due', formatCurrency((invoice.total ?? 0) - (invoice.amount_paid ?? 0))]);
  }

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Memo
  // ------------------------------------------------------------------
  if (invoice.memo) {
    children.push(heading('Notes', 2));
    children.push(calloutBox(invoice.memo as string, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Payment Instructions
  // ------------------------------------------------------------------
  children.push(heading('Payment Instructions', 2));
  children.push(
    body('Please remit payment by the due date shown above. Include the invoice number on all correspondence.', {
      spacing: { after: 120 },
    }),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: `Invoice ${invoice.invoice_number ?? ''}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
