/**
 * Packing List Document Template
 *
 * Generates a branded packing list with shipment info,
 * line items, weight totals, and shipper/receiver sign-off.
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

interface PackingListItem {
  name: string;
  quantity: number;
  weight_lbs: number | null;
  dimensions: string | null;
  notes: string | null;
}

interface PackingListData {
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
    notes: string | null;
  };
  lineItems: PackingListItem[];
  eventName?: string;
  clientName?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generatePackingList(data: PackingListData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { shipment, lineItems } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('PACKING LIST', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Shipment Info
  // ------------------------------------------------------------------
  const shipInfo: Array<[string, string]> = [
    ['Shipment #', shipment.shipment_number],
    ['Direction', shipment.direction === 'inbound' ? 'Inbound (Receiving)' : 'Outbound (Shipping)'],
    ['Carrier', shipment.carrier ?? '\u2014'],
    ['Tracking #', shipment.tracking_number ?? '\u2014'],
    ['Ship Date', formatDate(shipment.ship_date)],
    ['Est. Arrival', formatDate(shipment.estimated_arrival)],
  ];

  if (data.eventName) shipInfo.push(['Event', data.eventName]);
  if (data.clientName) shipInfo.push(['Client', data.clientName]);

  children.push(kvTable(shipInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Origin / Destination
  // ------------------------------------------------------------------
  children.push(heading('Routing', 2));

  const routing: Array<[string, string]> = [
    ['Origin', shipment.origin_address ?? '\u2014'],
    ['Destination', shipment.destination_address ?? '\u2014'],
  ];

  children.push(kvTable(routing, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Line Items
  // ------------------------------------------------------------------
  children.push(heading('Contents', 2));

  const cols: TableColumn[] = [
    { header: '#', width: Math.floor(CONTENT_WIDTH * 0.06) },
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Weight', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Dimensions', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Notes', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const rows = lineItems.map((item, idx) => [
    String(idx + 1),
    item.name,
    String(item.quantity),
    item.weight_lbs ? `${item.weight_lbs} lbs` : '',
    item.dimensions ?? '',
    item.notes ?? '',
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Totals
  // ------------------------------------------------------------------
  const totalPieces = lineItems.reduce((sum, li) => sum + li.quantity, 0);
  const totalWeight = lineItems.reduce((sum, li) => sum + (li.weight_lbs ?? 0) * li.quantity, 0);

  children.push(heading('Summary', 2));

  const totals: Array<[string, string]> = [
    ['Total Line Items', String(lineItems.length)],
    ['Total Pieces', String(totalPieces)],
    ['Total Weight', `${totalWeight.toLocaleString()} lbs`],
  ];

  if (shipment.weight_lbs) {
    totals.push(['Declared Shipment Weight', `${shipment.weight_lbs} lbs`]);
  }

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Special Handling
  // ------------------------------------------------------------------
  if (shipment.notes) {
    children.push(heading('Special Handling Instructions', 2));
    children.push(calloutBox(shipment.notes, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Sign-Off
  // ------------------------------------------------------------------
  children.push(heading('Verification', 2));
  children.push(
    body('Contents have been verified and match the items listed above.', {
      spacing: { after: 200 },
    }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Packed By / Shipper' },
        { role: 'Received By' },
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
    documentTitle: 'Packing List',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
