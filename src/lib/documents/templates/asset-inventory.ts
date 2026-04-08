
/**
 * Asset Inventory & Disposition Report
 *
 * Generates a DOCX report covering asset inventory, location history,
 * disposition summary, and client sign-off directives.
 */

import type {
  Organization,
  Proposal,
  Client,
  Asset,
  AssetLocationHistory,
  AssetStatus,
} from '@/types/database';

import { AlignmentType } from 'docx';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  pageBreak,
  bullet,
  checkbox,
  labelValue,
  kvTable,
  dataTable,
  formatDate,
  formatCurrency,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import { castAssetLocationDoc } from '../doc-types';


// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface AssetInventoryData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  assets: Asset[];
  locationHistory: Array<AssetLocationHistory & { asset_name: string }>;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<AssetStatus, string> = {
  planned: 'Planned',
  in_production: 'In Production',
  in_transit: 'In Transit',
  deployed: 'Deployed',
  in_storage: 'In Storage',
  retired: 'Retired',
  disposed: 'Disposed',
};

function formatLocation(loc: { facilityId?: string; type?: string; venueId?: string } | null): string {
  if (!loc) return '\u2014';
  const parts: string[] = [];
  if (loc.type) parts.push(loc.type);
  if (loc.facilityId) parts.push(`Facility: ${loc.facilityId}`);
  if (loc.venueId) parts.push(`Venue: ${loc.venueId}`);
  return parts.length > 0 ? parts.join(', ') : '\u2014';
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateAssetInventory(data: AssetInventoryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, assets, locationHistory } = data;

  // Pre-calculate status counts
  const statusCounts = new Map<string, number>();
  for (const asset of assets) {
    statusCounts.set(asset.status, (statusCounts.get(asset.status) ?? 0) + 1);
  }

  const totalAcquisitionCost = assets.reduce((sum, a) => sum + (a.acquisition_cost ?? 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (a.current_value ?? 0), 0);

  // Group assets by status for disposition
  const assetsByStatus = new Map<string, Asset[]>();
  for (const asset of assets) {
    const list = assetsByStatus.get(asset.status) ?? [];
    list.push(asset);
    assetsByStatus.set(asset.status, list);
  }

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('ASSET INVENTORY & DISPOSITION REPORT', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Project Reference + Date
  // ------------------------------------------------------------------
  children.push(heading('Project Reference', 2));
  children.push(labelValue('Project', proposal.name, brand));
  children.push(labelValue('Client', client.company_name, brand));
  children.push(labelValue('Date', formatDate(proposal.prepared_date), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Asset Summary
  // ------------------------------------------------------------------
  children.push(heading('Asset Summary', 2));
  children.push(labelValue('Total Assets', String(assets.length), brand));

  for (const [status, count] of Array.from(statusCounts.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const label = STATUS_LABELS[status as AssetStatus] ?? status.replace(/_/g, ' ');
    children.push(labelValue(label, String(count), brand));
  }

  children.push(labelValue('Total Acquisition Cost', formatCurrency(totalAcquisitionCost, proposal.currency), brand));
  children.push(labelValue('Total Current Value', formatCurrency(totalCurrentValue, proposal.currency), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Asset Inventory Table
  // ------------------------------------------------------------------
  children.push(heading('Asset Inventory', 2));

  const inventoryCols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.17) },
    { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Condition', width: Math.floor(CONTENT_WIDTH * 0.11) },
    { header: 'Reusable', width: Math.floor(CONTENT_WIDTH * 0.08), align: AlignmentType.CENTER },
    { header: 'Dimensions', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Barcode', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];

  const inventoryRows = assets.map((a) => [
    a.name,
    a.type,
    a.category,
    STATUS_LABELS[a.status] ?? a.status,
    a.condition,
    a.is_reusable ? '\u2713' : '\u2717',
    a.dimensions ?? '\u2014',
    a.barcode ?? '\u2014',
  ]);

  if (inventoryRows.length > 0) {
    children.push(dataTable(inventoryCols, inventoryRows, brand));
  } else {
    children.push(body('No assets recorded.', { italic: true }));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Asset Detail Cards
  // ------------------------------------------------------------------
  if (assets.length > 0) {
    children.push(pageBreak());
    children.push(heading('Asset Details', 2));

    for (const asset of assets) {
      children.push(heading(asset.name, 3));

      const pairs: [string, string][] = [
        ['Status', STATUS_LABELS[asset.status] ?? asset.status],
        ['Condition', asset.condition],
        ['Acquisition Cost', asset.acquisition_cost != null ? formatCurrency(asset.acquisition_cost, proposal.currency) : '\u2014'],
        ['Current Value', asset.current_value != null ? formatCurrency(asset.current_value, proposal.currency) : '\u2014'],
        ['Deployment Count', String(asset.deployment_count)],
        ['Max Deployments', asset.max_deployments != null ? String(asset.max_deployments) : 'Unlimited'],
        ['Storage Requirements', asset.storage_requirements ?? '\u2014'],
      ];

      children.push(kvTable(pairs, brand));

      // Location info
      children.push(labelValue('Current Location', formatLocation(castAssetLocationDoc(asset.current_location)), brand));
      children.push(spacer(120));
    }
  }

  // ------------------------------------------------------------------
  // 6. Location History
  // ------------------------------------------------------------------
  if (locationHistory.length > 0) {
    children.push(pageBreak());
    children.push(heading('Location History', 2));

    const historyCols: TableColumn[] = [
      { header: 'Asset Name', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Location', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Moved At', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Condition', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Notes', width: Math.floor(CONTENT_WIDTH * 0.2) },
    ];

    const historyRows = locationHistory
      .sort((a, b) => new Date(b.moved_at).getTime() - new Date(a.moved_at).getTime())
      .map((h) => [
        h.asset_name,
        formatLocation(castAssetLocationDoc(h.location)),
        formatDate(h.moved_at),
        h.condition_at_move ?? '\u2014',
        h.notes ?? '',
      ]);

    children.push(dataTable(historyCols, historyRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Disposition Summary
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Disposition Summary', 2));
  children.push(
    body('Assets grouped by current status for client review and sign-off.', {
      spacing: { after: 120 },
    })
  );

  for (const [status, statusAssets] of Array.from(assetsByStatus.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const label = STATUS_LABELS[status as AssetStatus] ?? status.replace(/_/g, ' ');
    children.push(body(`${label} (${statusAssets.length})`, { bold: true, spacing: { before: 120, after: 60 } }));

    for (const asset of statusAssets) {
      children.push(bullet(`${asset.name} \u2014 ${asset.category}, Condition: ${asset.condition}`));
    }
  }

  children.push(spacer());

  // ------------------------------------------------------------------
  // 8. Asset Disposition Directive
  // ------------------------------------------------------------------
  children.push(heading('Asset Disposition Directive', 2));
  children.push(
    body(
      'Please indicate the desired disposition for each asset group below. Check the appropriate action for each status group.',
      { spacing: { after: 160 } }
    )
  );

  for (const [status, statusAssets] of Array.from(assetsByStatus.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const label = STATUS_LABELS[status as AssetStatus] ?? status.replace(/_/g, ' ');
    const assetNames = statusAssets.map((a) => a.name).join(', ');

    children.push(body(`${label}: ${assetNames}`, { bold: true, spacing: { before: 160, after: 60 } }));
    children.push(checkbox('Retain \u2014 Keep in active inventory'));
    children.push(checkbox('Store \u2014 Move to long-term storage'));
    children.push(checkbox('Transfer \u2014 Transfer ownership to client'));
    children.push(checkbox('Dispose \u2014 Decommission and dispose'));
  }

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Asset Inventory & Disposition Report',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
