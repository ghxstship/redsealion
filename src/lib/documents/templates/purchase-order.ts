/**
 * Purchase Order Document Template
 *
 * Generates a branded purchase order with vendor info, line items,
 * totals, terms, and authorization signature.
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

interface PoLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PurchaseOrderData {
  org: Organization;
  purchaseOrder: {
    po_number: string;
    status: string;
    order_date: string | null;
    expected_delivery: string | null;
    shipping_method: string | null;
    notes: string | null;
    subtotal: number;
    tax_amount: number;
    shipping_cost: number;
    total: number;
  };
  vendor: {
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  lineItems: PoLineItem[];
  shipToAddress?: string;
  billToAddress?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generatePurchaseOrder(data: PurchaseOrderData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { purchaseOrder, vendor, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('PURCHASE ORDER', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. PO Metadata
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['PO Number', purchaseOrder.po_number],
    ['Status', purchaseOrder.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Order Date', formatDate(purchaseOrder.order_date)],
    ['Expected Delivery', formatDate(purchaseOrder.expected_delivery)],
  ];
  if (purchaseOrder.shipping_method) {
    metaInfo.push(['Shipping Method', purchaseOrder.shipping_method]);
  }
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Vendor Info
  // ------------------------------------------------------------------
  children.push(heading('Vendor', 2));
  children.push(labelValue('Company', vendor.name, brand));
  if (vendor.contact_name) children.push(labelValue('Contact', vendor.contact_name, brand));
  if (vendor.email) children.push(labelValue('Email', vendor.email, brand));
  if (vendor.phone) children.push(labelValue('Phone', vendor.phone, brand));
  if (vendor.address) children.push(labelValue('Address', vendor.address, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Ship-To / Bill-To
  // ------------------------------------------------------------------
  if (data.shipToAddress || data.billToAddress) {
    children.push(heading('Addresses', 2));
    if (data.shipToAddress) children.push(labelValue('Ship To', data.shipToAddress, brand));
    if (data.billToAddress) children.push(labelValue('Bill To', data.billToAddress, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Line Items
  // ------------------------------------------------------------------
  children.push(heading('Order Items', 2));

  const cols: TableColumn[] = [
    { header: '#', width: Math.floor(CONTENT_WIDTH * 0.06) },
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.39) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Unit Price', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.25) },
  ];

  const rows = lineItems.map((li, idx) => [
    String(idx + 1),
    li.description,
    String(li.quantity),
    formatCurrency(li.unit_price),
    formatCurrency(li.total),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 6. Totals
  // ------------------------------------------------------------------
  children.push(heading('Order Total', 2));

  const totals: Array<[string, string]> = [
    ['Subtotal', formatCurrency(purchaseOrder.subtotal)],
  ];

  if (purchaseOrder.tax_amount > 0) {
    totals.push(['Tax', formatCurrency(purchaseOrder.tax_amount)]);
  }
  if (purchaseOrder.shipping_cost > 0) {
    totals.push(['Shipping', formatCurrency(purchaseOrder.shipping_cost)]);
  }
  totals.push(['Total', formatCurrency(purchaseOrder.total)]);

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Notes
  // ------------------------------------------------------------------
  if (purchaseOrder.notes) {
    children.push(heading('Terms & Notes', 2));
    children.push(body(purchaseOrder.notes, { spacing: { after: 120 } }));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 8. Authorization
  // ------------------------------------------------------------------
  children.push(heading('Authorization', 2));
  children.push(
    body('This purchase order is authorized by the undersigned.', {
      spacing: { after: 200 },
    }),
  );
  children.push(
    ...signatureBlock(
      [{ role: 'Authorized By', name: data.org.name }],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: `PO ${purchaseOrder.po_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
