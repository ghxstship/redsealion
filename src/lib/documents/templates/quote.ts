/**
 * Quote Document Template
 *
 * Generates a branded quote from the advances/catalog system with
 * quoted items, pricing, validity, and acceptance signature.
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

interface QuoteLine {
  item_name: string;
  quantity: number;
  daily_rate_cents: number;
  days: number;
  line_total_cents: number;
}

interface QuoteData {
  org: Organization;
  quote: {
    quote_number: string;
    date: string;
    valid_until: string;
    days: number;
    total_cents: number;
  };
  lines: QuoteLine[];
  clientName?: string;
  clientEmail?: string;
  projectName?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateQuote(data: QuoteData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { quote, lines } = data;

  const fmtCents = (cents: number) => formatCurrency(cents / 100);

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('QUOTE', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Quote Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Quote #', quote.quote_number],
    ['Date', formatDate(quote.date)],
    ['Valid Until', formatDate(quote.valid_until)],
    ['Rental Duration', `${quote.days} day(s)`],
  ];
  if (data.clientName) metaInfo.push(['Client', data.clientName]);
  if (data.projectName) metaInfo.push(['Project', data.projectName]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Client Info
  // ------------------------------------------------------------------
  if (data.clientName) {
    children.push(heading('Prepared For', 2));
    children.push(labelValue('Name', data.clientName, brand));
    if (data.clientEmail) children.push(labelValue('Email', data.clientEmail, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 4. Quoted Items
  // ------------------------------------------------------------------
  children.push(heading('Quoted Items', 2));

  const cols: TableColumn[] = [
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Daily Rate', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Days', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Line Total', width: Math.floor(CONTENT_WIDTH * 0.3) },
  ];

  const rows = lines.map((l) => [
    l.item_name,
    String(l.quantity),
    fmtCents(l.daily_rate_cents),
    String(l.days),
    fmtCents(l.line_total_cents),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 5. Total
  // ------------------------------------------------------------------
  children.push(heading('Quote Total', 2));

  const totals: Array<[string, string]> = [
    ['Total', fmtCents(quote.total_cents)],
    ['Validity', `Quote valid until ${formatDate(quote.valid_until)}`],
  ];

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Terms
  // ------------------------------------------------------------------
  children.push(heading('Terms', 2));
  children.push(body('Prices are subject to availability. Final pricing may vary based on delivery logistics and duration changes.', { spacing: { after: 120 } }));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Acceptance
  // ------------------------------------------------------------------
  children.push(heading('Acceptance', 2));
  children.push(
    body('By signing below, the client accepts this quote and authorizes the order.', {
      spacing: { after: 200 },
    }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Client', name: data.clientName ?? '' },
        { role: 'Account Representative', name: data.org.name },
      ],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: `Quote ${quote.quote_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
