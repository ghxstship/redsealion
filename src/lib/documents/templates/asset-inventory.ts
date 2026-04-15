/**
 * Asset Inventory Document Template
 *
 * Generates a branded asset inventory report with asset listing,
 * category summaries, and inspection sign-off block.
 */

import type { Organization, Asset } from '@/types/database';

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
  styledBox,
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface AssetInventoryData {
  org: Organization;
  assets: Asset[];
  scopeLabel?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateAssetInventory(data: AssetInventoryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { assets } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('ASSET INVENTORY', 1));
  children.push(
    labelValue('Inventory Date', formatDate(new Date().toISOString()), brand),
  );
  if (data.scopeLabel) {
    children.push(labelValue('Scope', data.scopeLabel, brand));
  }
  children.push(labelValue('Total Assets', String(assets.length), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 2. Asset Table
  // ------------------------------------------------------------------
  children.push(heading('Asset Register', 2));

  const cols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Barcode', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Location', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Condition', width: Math.floor(CONTENT_WIDTH * 0.11) },
    { header: 'Value', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Last Checked', width: Math.floor(CONTENT_WIDTH * 0.1) },
  ];

  const rows = assets.map((a) => [
    a.name ?? '',
    (a.barcode as string) ?? '',
    (a.category as string) ?? '',
    ((a.status as string) ?? '').replace(/_/g, ' '),
    '',
    (a.condition as string) ?? '',
    a.acquisition_cost ? formatCurrency(a.acquisition_cost as number) : '\u2014',
    formatDate(a.updated_at),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Category Summary
  // ------------------------------------------------------------------
  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();

  for (const asset of assets) {
    const cat = (asset.category as string) ?? 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);

    const status = (asset.status as string) ?? 'unknown';
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  children.push(heading('Category Summary', 2));

  const catCols: TableColumn[] = [
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.5) },
    { header: 'Count', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: '% of Total', width: Math.floor(CONTENT_WIDTH * 0.25) },
  ];

  const catRows = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => [
      cat,
      String(count),
      assets.length > 0 ? `${((count / assets.length) * 100).toFixed(1)}%` : '\u2014',
    ]);

  children.push(dataTable(catCols, catRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Status Breakdown
  // ------------------------------------------------------------------
  children.push(heading('Status Breakdown', 2));

  const statusPairs: Array<[string, string]> = Array.from(statusMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => [
      status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      String(count),
    ]);

  children.push(kvTable(statusPairs, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Missing/Damaged Items
  // ------------------------------------------------------------------
  const flaggedAssets = assets.filter(
    (a) => (a.status as string) === 'damaged' || (a.status as string) === 'missing' || (a.condition as string) === 'poor',
  );

  if (flaggedAssets.length > 0) {
    children.push(
      ...styledBox(
        'Attention Required',
        flaggedAssets.map(
          (a) => `${a.name ?? 'Unknown'} \u2014 ${(a.status as string) ?? ''} (${(a.condition as string) ?? ''})`,
        ),
        'addon',
        brand,
      ),
    );
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Inspection Sign-Off
  // ------------------------------------------------------------------
  children.push(heading('Inspection Sign-Off', 2));
  children.push(
    body('I certify that I have conducted a physical inspection of the above assets and the information recorded is accurate to the best of my knowledge.', {
      spacing: { after: 200 },
    }),
  );
  children.push(
    ...signatureBlock(
      [{ role: 'Inspector' }, { role: 'Asset Manager' }],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Asset Inventory',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
