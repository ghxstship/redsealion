/**
 * Accounts Receivable Aging Document Template
 *
 * Generates a branded AR aging report showing outstanding invoices
 * grouped by aging bucket (Current, 31-60, 61-90, 90+) with
 * client-level breakdown and totals.
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

interface ArInvoice {
  invoice_number: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  total: number;
  amount_paid: number;
  balance: number;
  status: string;
}

interface ArAgingData {
  org: Organization;
  asOfDate: string;
  invoices: ArInvoice[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type AgingBucket = 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90plus';

const BUCKET_LABELS: Record<AgingBucket, string> = {
  current: 'Current',
  d1_30: '1\u201330 Days',
  d31_60: '31\u201360 Days',
  d61_90: '61\u201390 Days',
  d90plus: '90+ Days',
};

function getBucket(dueDate: string, asOf: Date): AgingBucket {
  const daysOverdue = Math.floor((asOf.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'd1_30';
  if (daysOverdue <= 60) return 'd31_60';
  if (daysOverdue <= 90) return 'd61_90';
  return 'd90plus';
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateArAging(data: ArAgingData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { invoices, asOfDate } = data;
  const asOf = new Date(asOfDate);

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('ACCOUNTS RECEIVABLE AGING', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Report Info
  // ------------------------------------------------------------------
  const outstandingInvoices = invoices.filter((i) => i.balance > 0);
  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + i.balance, 0);

  const metaInfo: Array<[string, string]> = [
    ['Organization', data.org.name],
    ['As of Date', formatDate(asOfDate)],
    ['Outstanding Invoices', String(outstandingInvoices.length)],
    ['Total Outstanding', formatCurrency(totalOutstanding)],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Aging Buckets Summary
  // ------------------------------------------------------------------
  const bucketTotals: Record<AgingBucket, number> = {
    current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0,
  };

  for (const inv of outstandingInvoices) {
    const bucket = getBucket(inv.due_date, asOf);
    bucketTotals[bucket] += inv.balance;
  }

  children.push(heading('Aging Summary', 2));

  const bucketCols: TableColumn[] = Object.keys(BUCKET_LABELS).map((key) => ({
    header: BUCKET_LABELS[key as AgingBucket],
    width: Math.floor(CONTENT_WIDTH / 5),
  }));

  children.push(dataTable(bucketCols, [[
    formatCurrency(bucketTotals.current),
    formatCurrency(bucketTotals.d1_30),
    formatCurrency(bucketTotals.d31_60),
    formatCurrency(bucketTotals.d61_90),
    formatCurrency(bucketTotals.d90plus),
  ]], brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Client-Level Breakdown
  // ------------------------------------------------------------------
  const clientMap = new Map<string, {
    current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number; total: number;
  }>();

  for (const inv of outstandingInvoices) {
    const bucket = getBucket(inv.due_date, asOf);
    const existing = clientMap.get(inv.client_name) ?? {
      current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0,
    };
    existing[bucket] += inv.balance;
    existing.total += inv.balance;
    clientMap.set(inv.client_name, existing);
  }

  children.push(heading('Client Breakdown', 2));

  const clientCols: TableColumn[] = [
    { header: 'Client', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Current', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: '1\u201330', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: '31\u201360', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: '61\u201390', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: '90+', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];

  const clientRows = Array.from(clientMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, d]) => [
      name,
      formatCurrency(d.current),
      formatCurrency(d.d1_30),
      formatCurrency(d.d31_60),
      formatCurrency(d.d61_90),
      formatCurrency(d.d90plus),
      formatCurrency(d.total),
    ]);

  children.push(dataTable(clientCols, clientRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Invoice Detail
  // ------------------------------------------------------------------
  children.push(heading('Invoice Detail', 2));

  const detailCols: TableColumn[] = [
    { header: 'Invoice #', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Client', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Issue Date', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Due Date', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Paid', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Balance', width: Math.floor(CONTENT_WIDTH * 0.14) },
  ];

  const detailRows = outstandingInvoices
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .map((inv) => [
      inv.invoice_number,
      inv.client_name,
      formatDate(inv.issue_date),
      formatDate(inv.due_date),
      formatCurrency(inv.total),
      formatCurrency(inv.amount_paid),
      formatCurrency(inv.balance),
    ]);

  children.push(dataTable(detailCols, detailRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Footer
  // ------------------------------------------------------------------
  children.push(
    body(`This report was generated on ${formatDate(new Date().toISOString())} and reflects outstanding balances as of ${formatDate(asOfDate)}.`, {
      spacing: { after: 200 },
    }),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'AR Aging Report',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
