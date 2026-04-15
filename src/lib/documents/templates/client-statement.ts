/**
 * Client Statement Document Template
 *
 * Generates a branded client account statement showing all invoices
 * for a given period with running balance and aging summary.
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

interface StatementInvoice {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total: number;
  amount_paid: number;
  balance: number;
}

interface ClientStatementData {
  org: Organization;
  client: {
    name: string;
    company: string | null;
    email: string | null;
    address: string | null;
  };
  period: {
    start: string;
    end: string;
  };
  invoices: StatementInvoice[];
  previousBalance: number;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateClientStatement(data: ClientStatementData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { client, period, invoices, previousBalance } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('STATEMENT OF ACCOUNT', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Client & Statement Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Client', client.company ?? client.name],
    ['Contact', client.name],
  ];
  if (client.email) metaInfo.push(['Email', client.email]);
  if (client.address) metaInfo.push(['Address', client.address]);
  metaInfo.push(
    ['Statement Period', `${formatDate(period.start)} \u2013 ${formatDate(period.end)}`],
    ['Statement Date', formatDate(new Date().toISOString())],
  );
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Invoice History
  // ------------------------------------------------------------------
  children.push(heading('Invoice History', 2));

  const invCols: TableColumn[] = [
    { header: 'Invoice #', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Issue Date', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Due Date', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Paid', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Balance', width: Math.floor(CONTENT_WIDTH * 0.17) },
  ];

  const invRows = invoices.map((inv) => [
    inv.invoice_number,
    formatDate(inv.issue_date),
    formatDate(inv.due_date),
    inv.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    formatCurrency(inv.total),
    formatCurrency(inv.amount_paid),
    formatCurrency(inv.balance),
  ]);

  children.push(dataTable(invCols, invRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Aging Summary
  // ------------------------------------------------------------------
  const now = new Date();
  const buckets = { current: 0, d31_60: 0, d61_90: 0, d90plus: 0 };

  for (const inv of invoices) {
    if (inv.balance <= 0) continue;
    const daysOld = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld <= 0) buckets.current += inv.balance;
    else if (daysOld <= 30) buckets.current += inv.balance;
    else if (daysOld <= 60) buckets.d31_60 += inv.balance;
    else if (daysOld <= 90) buckets.d61_90 += inv.balance;
    else buckets.d90plus += inv.balance;
  }

  children.push(heading('Aging Summary', 2));

  const agingCols: TableColumn[] = [
    { header: 'Current', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: '31\u201360 Days', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: '61\u201390 Days', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: '90+ Days', width: Math.floor(CONTENT_WIDTH * 0.25) },
  ];

  children.push(dataTable(agingCols, [[
    formatCurrency(buckets.current),
    formatCurrency(buckets.d31_60),
    formatCurrency(buckets.d61_90),
    formatCurrency(buckets.d90plus),
  ]], brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Account Summary
  // ------------------------------------------------------------------
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amount_paid, 0);
  const totalBalance = invoices.reduce((sum, i) => sum + i.balance, 0);

  children.push(heading('Account Summary', 2));

  const totals: Array<[string, string]> = [
    ['Previous Balance', formatCurrency(previousBalance)],
    ['Total Invoiced (this period)', formatCurrency(totalInvoiced)],
    ['Total Payments Received', formatCurrency(totalPaid)],
    ['Balance Due', formatCurrency(totalBalance + previousBalance)],
  ];

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Payment Instructions
  // ------------------------------------------------------------------
  children.push(heading('Payment Instructions', 2));
  children.push(
    body(
      'Please reference the invoice number when making payment. For questions regarding this statement, please contact accounts@' +
        (data.org.name.toLowerCase().replace(/\s+/g, '') + '.com') +
        '.',
      { spacing: { after: 200 } },
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Client Statement',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
