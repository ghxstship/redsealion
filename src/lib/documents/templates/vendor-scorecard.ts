/**
 * Vendor Scorecard Document Template
 *
 * Generates a branded vendor performance scorecard with
 * delivery, quality, and cost metrics.
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

interface VendorOrder {
  po_number: string;
  order_date: string;
  total: number;
  delivery_status: string;
  days_late: number;
}

interface VendorScorecardData {
  org: Organization;
  vendor: {
    name: string;
    contact_email: string | null;
    category: string | null;
  };
  period: { start: string; end: string };
  orders: VendorOrder[];
  totalSpend: number;
  onTimeRate: number;
  avgLeadDays: number;
  returnRate: number;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateVendorScorecard(data: VendorScorecardData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { vendor, period, orders } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('VENDOR SCORECARD', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Vendor', vendor.name],
    ['Category', vendor.category ?? '\u2014'],
    ['Contact', vendor.contact_email ?? '\u2014'],
    ['Review Period', `${formatDate(period.start)} \u2013 ${formatDate(period.end)}`],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  children.push(heading('Performance Metrics', 2));
  const metrics: Array<[string, string]> = [
    ['Total Spend', formatCurrency(data.totalSpend)],
    ['On-Time Delivery Rate', `${data.onTimeRate.toFixed(0)}%`],
    ['Average Lead Time', `${data.avgLeadDays.toFixed(0)} days`],
    ['Return/Rejection Rate', `${data.returnRate.toFixed(1)}%`],
    ['Total Orders', String(orders.length)],
  ];
  children.push(kvTable(metrics, brand));
  children.push(spacer());

  if (orders.length > 0) {
    children.push(heading('Order History', 2));

    const cols: TableColumn[] = [
      { header: 'PO #', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Date', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Amount', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Days Late', width: Math.floor(CONTENT_WIDTH * 0.2) },
    ];

    const rows = orders.map((o) => [
      o.po_number,
      formatDate(o.order_date),
      formatCurrency(o.total),
      o.delivery_status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      o.days_late > 0 ? String(o.days_late) : 'On Time',
    ]);

    children.push(dataTable(cols, rows, brand));
    children.push(spacer());
  }

  children.push(
    body(`This scorecard was generated on ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }),
  );

  const section = buildSection({ brand, children, documentTitle: 'Vendor Scorecard' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
