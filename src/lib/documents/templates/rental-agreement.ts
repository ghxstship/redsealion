/**
 * Rental Agreement Document Template
 *
 * Generates a branded rental agreement with equipment listing,
 * rental terms, deposit/payment info, and dual signature block.
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
  bullet,
  dataTable,
  kvTable,
  signatureBlock,
  formatCurrency,
  formatDate,
  pageBreak,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface RentalLineItem {
  name: string;
  daily_rate: number;
  rental_days: number;
  quantity: number;
  total: number;
}

interface RentalAgreementData {
  org: Organization;
  rental: {
    order_number: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    delivery_date: string | null;
    pickup_date: string | null;
    deposit_amount: number;
    subtotal: number;
    tax_amount: number;
    total: number;
    notes: string | null;
  };
  client: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  lineItems: RentalLineItem[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateRentalAgreement(data: RentalAgreementData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { rental, client, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('RENTAL AGREEMENT', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Agreement Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Agreement #', rental.order_number],
    ['Status', rental.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Rental Period', `${formatDate(rental.start_date)} \u2013 ${formatDate(rental.end_date)}`],
  ];
  if (rental.delivery_date) metaInfo.push(['Delivery Date', formatDate(rental.delivery_date)]);
  if (rental.pickup_date) metaInfo.push(['Pickup Date', formatDate(rental.pickup_date)]);

  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Client / Lessee Info
  // ------------------------------------------------------------------
  children.push(heading('Lessee Information', 2));
  children.push(labelValue('Name', client.name, brand));
  if (client.company) children.push(labelValue('Company', client.company, brand));
  if (client.email) children.push(labelValue('Email', client.email, brand));
  if (client.phone) children.push(labelValue('Phone', client.phone, brand));
  if (client.address) children.push(labelValue('Address', client.address, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Equipment Table
  // ------------------------------------------------------------------
  children.push(heading('Rental Equipment', 2));

  const cols: TableColumn[] = [
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Daily Rate', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Days', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.35) },
  ];

  const rows = lineItems.map((li) => [
    li.name,
    formatCurrency(li.daily_rate),
    String(li.rental_days),
    String(li.quantity),
    formatCurrency(li.total),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 5. Financial Summary
  // ------------------------------------------------------------------
  children.push(heading('Payment Summary', 2));

  const totals: Array<[string, string]> = [
    ['Subtotal', formatCurrency(rental.subtotal)],
  ];
  if (rental.tax_amount > 0) totals.push(['Tax', formatCurrency(rental.tax_amount)]);
  totals.push(['Total', formatCurrency(rental.total)]);
  if (rental.deposit_amount > 0) {
    totals.push(['Security Deposit', formatCurrency(rental.deposit_amount)]);
    totals.push(['Total Due at Signing', formatCurrency(rental.total + rental.deposit_amount)]);
  }

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Terms & Conditions
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Terms & Conditions', 2));

  children.push(bullet('The Lessee agrees to use the equipment only for its intended purpose.'));
  children.push(bullet('The Lessee shall be responsible for any loss, theft, or damage to the equipment during the rental period.'));
  children.push(bullet('Equipment must be returned in the same condition as received, normal wear and tear excepted.'));
  children.push(bullet('Late returns will incur additional daily rental charges at the agreed rate.'));
  children.push(bullet('The security deposit will be refunded within 14 business days after equipment inspection upon return.'));
  children.push(bullet('The Lessor reserves the right to inspect the equipment at any reasonable time during the rental period.'));
  children.push(bullet('This agreement may be terminated early by either party with 48 hours written notice, subject to minimum rental charges.'));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Notes
  // ------------------------------------------------------------------
  if (rental.notes) {
    children.push(heading('Additional Notes', 2));
    children.push(body(rental.notes, { spacing: { after: 120 } }));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 8. Signatures
  // ------------------------------------------------------------------
  children.push(heading('Agreement Acceptance', 2));
  children.push(
    body(
      'By signing below, both parties agree to the rental terms and conditions described in this agreement.',
      { spacing: { after: 200 } },
    ),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Lessee', name: client.name },
        { role: 'Lessor', name: data.org.name },
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
    documentTitle: `Rental Agreement ${rental.order_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
