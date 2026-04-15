/**
 * Credit Note Document Template
 *
 * Generates a branded credit note referencing the original invoice,
 * with credited line items and remaining balance.
 */

import type { Organization, Client } from '@/types/database';

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
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import { castDocAddress } from '../doc-types';
import { AlignmentType } from 'docx';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface CreditNoteData {
  org: Organization;
  client: Client;
  creditNote: {
    credit_note_number: string;
    invoice_number: string;
    issue_date: string;
    reason: string | null;
    status: string;
    line_items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    subtotal: number;
    tax_amount: number;
    total: number;
    original_invoice_total: number;
    remaining_balance: number;
  };
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateCreditNote(data: CreditNoteData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { client, creditNote } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('CREDIT NOTE', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Credit Note metadata
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Credit Note #', creditNote.credit_note_number],
    ['Original Invoice', creditNote.invoice_number],
    ['Issue Date', formatDate(creditNote.issue_date)],
    ['Status', creditNote.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Issued To
  // ------------------------------------------------------------------
  children.push(heading('Issued To', 2));
  children.push(labelValue('Company', client.company_name ?? '', brand));

  const addr = castDocAddress(client.billing_address);
  if (addr) {
    const addrLine = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
    children.push(labelValue('Address', addrLine, brand));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Reason
  // ------------------------------------------------------------------
  if (creditNote.reason) {
    children.push(heading('Reason', 2));
    children.push(body(creditNote.reason, { spacing: { after: 120 } }));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Credited Items
  // ------------------------------------------------------------------
  children.push(heading('Credited Items', 2));

  const cols: TableColumn[] = [
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.15), align: AlignmentType.RIGHT },
    { header: 'Rate', width: Math.floor(CONTENT_WIDTH * 0.2), align: AlignmentType.RIGHT },
    { header: 'Credit', width: Math.floor(CONTENT_WIDTH * 0.25), align: AlignmentType.RIGHT },
  ];

  const rows = creditNote.line_items.map((li) => [
    li.description,
    String(li.quantity),
    formatCurrency(li.rate),
    `(${formatCurrency(li.amount)})`,
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 6. Totals
  // ------------------------------------------------------------------
  children.push(heading('Summary', 2));

  const totals: Array<[string, string]> = [
    ['Subtotal Credit', `(${formatCurrency(creditNote.subtotal)})`],
  ];

  if (creditNote.tax_amount > 0) {
    totals.push(['Tax Credit', `(${formatCurrency(creditNote.tax_amount)})`]);
  }

  totals.push(
    ['Total Credit', `(${formatCurrency(creditNote.total)})`],
    ['Original Invoice Total', formatCurrency(creditNote.original_invoice_total)],
    ['Remaining Balance', formatCurrency(creditNote.remaining_balance)],
  );

  children.push(kvTable(totals, brand));

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: `Credit Note ${creditNote.credit_note_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
