/**
 * Invoice Document Template
 *
 * Professional invoice with line items, payment terms, payment history,
 * and payment instructions. White-label via org brand_config.
 */

import {
  Paragraph,
  Table,
  AlignmentType,
} from 'docx';

import type {
  Organization,
  Invoice,
  InvoiceLineItem,
  Client,
  ClientContact,
  Proposal,
  InvoicePayment,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  heading,
  body,
  spacer,
  labelValue,
  calloutBox,
  dataTable,
  kvTable,
  formatCurrency,
  formatDate,
  createDocument,
  packDocument,
  type DocBrand,
  type TableColumn,
} from '../engine';

import { castAddress, castPaymentTerms } from '../json-casts';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface InvoiceDocumentData {
  org: Organization;
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
  client: Client;
  clientContact: ClientContact | null;
  proposal: Proposal | null;
  payments: InvoicePayment[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toUpperCase();
}

function buildBillTo(data: InvoiceDocumentData, _brand: DocBrand): (Paragraph | Table)[] {
  const { client, clientContact } = data;
  const parts: (Paragraph | Table)[] = [heading('Bill To', 2)];

  parts.push(body(client.company_name, { bold: true, size: 24 }));

  if (clientContact) {
    parts.push(
      body(`${clientContact.first_name} ${clientContact.last_name}${clientContact.title ? `, ${clientContact.title}` : ''}`)
    );
    parts.push(body(clientContact.email));
  }

  if (client.billing_address) {
    const addr = castAddress(client.billing_address);
    if (addr) {
      const lines: string[] = [];
      if (addr.street) lines.push(addr.street);
    const cityLine = [addr.city, addr.state].filter(Boolean).join(', ');
    if (cityLine) lines.push(`${cityLine}${addr.zip ? ` ${addr.zip}` : ''}`);
    if (addr.country && addr.country !== 'US' && addr.country !== 'USA') lines.push(addr.country);
    lines.forEach((l) => parts.push(body(l)));
    }
  }

  return parts;
}

function buildLineItemsTable(lineItems: InvoiceLineItem[], brand: DocBrand, currency: string): Table {
  const columns: TableColumn[] = [
    { header: 'Description', width: 3800 },
    { header: 'Phase', width: 1000, align: AlignmentType.CENTER },
    { header: 'Qty', width: 900, align: AlignmentType.CENTER },
    { header: 'Rate', width: 1600, align: AlignmentType.RIGHT },
    { header: 'Amount', width: 2060, align: AlignmentType.RIGHT },
  ];

  const rows = lineItems.map((li) => [
    li.description,
    li.phase_number ?? '-',
    li.quantity.toString(),
    formatCurrency(li.rate, currency),
    formatCurrency(li.amount, currency),
  ]);

  return dataTable(columns, rows, brand);
}

function buildTotalsSection(data: InvoiceDocumentData, brand: DocBrand): (Paragraph | Table)[] {
  const { invoice } = data;
  const cur = invoice.currency;
  const balanceDue = invoice.total - invoice.amount_paid;

  const pairs: Array<[string, string]> = [
    ['Subtotal', formatCurrency(invoice.subtotal, cur)],
    ['Tax', formatCurrency(invoice.tax_amount, cur)],
    ['Total', formatCurrency(invoice.total, cur)],
    ['Amount Paid', formatCurrency(invoice.amount_paid, cur)],
    ['Balance Due', formatCurrency(balanceDue, cur)],
  ];

  return [
    spacer(200),
    kvTable(pairs, brand, 3000),
  ];
}

function buildPaymentTermsSection(data: InvoiceDocumentData, brand: DocBrand): (Paragraph | Table)[] {
  const terms = castPaymentTerms(data.org.default_payment_terms);
  if (!terms) return [];

  const parts: (Paragraph | Table)[] = [heading('Payment Terms', 2)];

  parts.push(labelValue('Structure', terms.structure, brand));
  parts.push(
    labelValue(
      'Deposit / Balance',
      `${terms.depositPercent}% deposit, ${terms.balancePercent}% balance`,
      brand
    )
  );

  if (terms.lateFeeRate != null && terms.lateFeeRate > 0) {
    parts.push(labelValue('Late Fee', `${terms.lateFeeRate}% per month on overdue balances`, brand));
  }

  if (terms.creditCardSurcharge != null && terms.creditCardSurcharge > 0) {
    parts.push(labelValue('Credit Card Surcharge', `${terms.creditCardSurcharge}%`, brand));
  }

  return parts;
}

function buildPaymentHistory(payments: InvoicePayment[], brand: DocBrand, currency: string): (Paragraph | Table)[] {
  if (payments.length === 0) return [];

  const columns: TableColumn[] = [
    { header: 'Date', width: 2400 },
    { header: 'Amount', width: 2400, align: AlignmentType.RIGHT },
    { header: 'Method', width: 2160, align: AlignmentType.CENTER },
    { header: 'Reference', width: 2400 },
  ];

  const rows = payments.map((p) => [
    formatDate(p.received_date),
    formatCurrency(p.amount, currency),
    p.method,
    p.reference ?? '-',
  ]);

  return [
    heading('Payment History', 2),
    dataTable(columns, rows, brand),
  ];
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateInvoiceDocument(data: InvoiceDocumentData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { invoice, proposal } = data;
  const cur = invoice.currency;

  // -- Assemble sections --
  const children: (Paragraph | Table)[] = [];

  // 1. Title
  children.push(heading('INVOICE', 1));

  // 2. Invoice metadata
  const metaPairs: Array<[string, string]> = [
    ['Invoice #', invoice.invoice_number],
    ['Date', formatDate(invoice.issue_date)],
    ['Due Date', formatDate(invoice.due_date)],
    ['Status', statusLabel(invoice.status)],
    ['Currency', cur],
  ];
  children.push(kvTable(metaPairs, brand));
  children.push(spacer(200));

  // 3. Bill To
  children.push(...buildBillTo(data, brand));
  children.push(spacer(200));

  // 4. Reference (if linked to a proposal)
  if (proposal) {
    children.push(heading('Reference', 2));
    children.push(labelValue('Proposal', proposal.name, brand));
    children.push(labelValue('Proposal ID', proposal.id, brand));
    children.push(spacer(200));
  }

  // 5. Line items
  children.push(heading('Line Items', 2));
  children.push(buildLineItemsTable(data.lineItems, brand, cur));

  // 6. Totals
  children.push(...buildTotalsSection(data, brand));
  children.push(spacer(200));

  // 7. Payment terms
  children.push(...buildPaymentTermsSection(data, brand));

  // 8. Payment history
  children.push(...buildPaymentHistory(data.payments, brand, cur));

  // 9. Payment instructions
  if (data.org.payment_instructions) {
    children.push(spacer(200));
    children.push(heading('Payment Instructions', 2));
    children.push(body(data.org.payment_instructions));
  }

  // 10. Footer callout with org name and facilities
  children.push(spacer(300));
  const facilityNames = brand.facilities?.map((f) => `${f.name} (${f.city}, ${f.state})`).join(' | ') ?? '';
  if (facilityNames) {
    children.push(calloutBox(`${brand.orgName}  |  ${facilityNames}`, brand));
  } else {
    children.push(calloutBox(brand.orgName, brand));
  }

  // -- Build document --
  const section = buildSection({
    brand,
    children,
    documentTitle: `Invoice ${invoice.invoice_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
