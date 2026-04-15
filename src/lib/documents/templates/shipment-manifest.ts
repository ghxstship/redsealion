/**
 * Shipment Manifest Document Template
 *
 * Generates a branded shipping manifest with carrier info,
 * full inventory, weight totals, and driver/receiver signatures.
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
  calloutBox,
  dataTable,
  kvTable,
  signatureBlock,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface ManifestLineItem {
  name: string;
  quantity: number;
  weight_lbs: number | null;
  notes: string | null;
}

interface ShipmentManifestData {
  org: Organization;
  shipment: {
    shipment_number: string;
    direction: string;
    carrier: string | null;
    tracking_number: string | null;
    origin_address: string | null;
    destination_address: string | null;
    ship_date: string | null;
    estimated_arrival: string | null;
    weight_lbs: number | null;
    num_pieces: number;
    shipping_cost_cents: number;
    notes: string | null;
  };
  lineItems: ManifestLineItem[];
  eventName?: string;
  vendorName?: string;
  clientName?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateShipmentManifest(data: ShipmentManifestData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { shipment, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('SHIPMENT MANIFEST', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Shipment Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Manifest #', shipment.shipment_number],
    ['Direction', shipment.direction === 'inbound' ? 'Inbound' : 'Outbound'],
    ['Ship Date', formatDate(shipment.ship_date)],
    ['Est. Arrival', formatDate(shipment.estimated_arrival)],
  ];
  if (data.eventName) metaInfo.push(['Event', data.eventName]);
  if (data.vendorName) metaInfo.push(['Vendor', data.vendorName]);
  if (data.clientName) metaInfo.push(['Client', data.clientName]);

  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Carrier Details
  // ------------------------------------------------------------------
  children.push(heading('Carrier Information', 2));
  children.push(labelValue('Carrier', shipment.carrier ?? 'Not specified', brand));
  children.push(labelValue('Tracking #', shipment.tracking_number ?? 'N/A', brand));
  if (shipment.shipping_cost_cents > 0) {
    children.push(labelValue('Shipping Cost', `$${(shipment.shipping_cost_cents / 100).toFixed(2)}`, brand));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Routing
  // ------------------------------------------------------------------
  children.push(heading('Routing', 2));
  children.push(labelValue('Origin', shipment.origin_address ?? '\u2014', brand));
  children.push(labelValue('Destination', shipment.destination_address ?? '\u2014', brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Inventory
  // ------------------------------------------------------------------
  children.push(heading('Manifest Contents', 2));

  const cols: TableColumn[] = [
    { header: '#', width: Math.floor(CONTENT_WIDTH * 0.06) },
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Weight (lbs)', width: Math.floor(CONTENT_WIDTH * 0.17) },
    { header: 'Notes', width: Math.floor(CONTENT_WIDTH * 0.25) },
  ];

  const rows = lineItems.map((li, idx) => [
    String(idx + 1),
    li.name,
    String(li.quantity),
    li.weight_lbs ? String(li.weight_lbs) : '',
    li.notes ?? '',
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 6. Totals
  // ------------------------------------------------------------------
  const totalPieces = lineItems.reduce((sum, li) => sum + li.quantity, 0);
  const totalWeight = lineItems.reduce((sum, li) => sum + (li.weight_lbs ?? 0) * li.quantity, 0);

  const totals: Array<[string, string]> = [
    ['Line Items', String(lineItems.length)],
    ['Total Pieces', String(totalPieces)],
    ['Total Weight', `${totalWeight.toLocaleString()} lbs`],
    ['Declared Weight', shipment.weight_lbs ? `${shipment.weight_lbs} lbs` : '\u2014'],
    ['Declared Pieces', String(shipment.num_pieces)],
  ];

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Special Instructions
  // ------------------------------------------------------------------
  if (shipment.notes) {
    children.push(heading('Special Instructions', 2));
    children.push(calloutBox(shipment.notes, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 8. Signatures
  // ------------------------------------------------------------------
  children.push(heading('Verification', 2));
  children.push(
    body('Contents verified and accepted as described above.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Shipper / Driver' },
        { role: 'Receiver' },
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
    documentTitle: `Manifest ${shipment.shipment_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
