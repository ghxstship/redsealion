/**
 * Bill of Materials (BOM) Document Template
 *
 * Generates a branded BOM with per-phase item breakdown,
 * category subtotals, and weight/piece count summary.
 */

import type { Organization, Proposal, Phase } from '@/types/database';

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
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface BomItem {
  name: string;
  category: string | null;
  qty: number;
  unit_cost: number;
  total_cost: number;
  description: string | null;
  dimensions?: string | null;
  weight?: number | null;
  material?: string | null;
}

interface BomData {
  org: Organization;
  proposal: Proposal;
  phases: Phase[];
  itemsByPhase: Map<string, BomItem[]>;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateBom(data: BomData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, phases, itemsByPhase } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('BILL OF MATERIALS', 1));
  children.push(body(proposal.name, { bold: true, size: 26, spacing: { after: 200 } }));

  children.push(
    labelValue('Generated', formatDate(new Date().toISOString()), brand),
  );
  children.push(spacer());

  // ------------------------------------------------------------------
  // 2. Per-Phase BOM
  // ------------------------------------------------------------------
  let totalPieces = 0;
  let totalWeight = 0;
  let totalCost = 0;
  const categoryTotals = new Map<string, number>();

  for (const phase of phases) {
    const items = itemsByPhase.get(phase.id) ?? [];
    if (items.length === 0) continue;

    children.push(heading(`${phase.phase_number ?? ''} \u2014 ${phase.name}`, 2));

    const cols: TableColumn[] = [
      { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.12) },
      { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.08) },
      { header: 'Dimensions', width: Math.floor(CONTENT_WIDTH * 0.12) },
      { header: 'Weight', width: Math.floor(CONTENT_WIDTH * 0.1) },
      { header: 'Material', width: Math.floor(CONTENT_WIDTH * 0.1) },
      { header: 'Unit Cost', width: Math.floor(CONTENT_WIDTH * 0.11) },
      { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.12) },
    ];

    const rows = items.map((item) => {
      totalPieces += item.qty;
      totalWeight += (item.weight ?? 0) * item.qty;
      totalCost += item.total_cost;

      const cat = item.category ?? 'Uncategorized';
      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + item.total_cost);

      return [
        item.name,
        item.category ?? '',
        String(item.qty),
        item.dimensions ?? '',
        item.weight ? `${item.weight} lbs` : '',
        item.material ?? '',
        formatCurrency(item.unit_cost),
        formatCurrency(item.total_cost),
      ];
    });

    children.push(dataTable(cols, rows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 3. Category Subtotals
  // ------------------------------------------------------------------
  if (categoryTotals.size > 0) {
    children.push(heading('Category Summary', 2));

    const catCols: TableColumn[] = [
      { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.5) },
      { header: 'Total Cost', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: '% of Total', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const catRows = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, cost]) => [
        cat,
        formatCurrency(cost),
        totalCost > 0 ? `${((cost / totalCost) * 100).toFixed(1)}%` : '\u2014',
      ]);

    children.push(dataTable(catCols, catRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 4. Totals Summary
  // ------------------------------------------------------------------
  children.push(heading('Totals', 2));

  const summary: Array<[string, string]> = [
    ['Total Pieces', String(totalPieces)],
    ['Total Weight', `${totalWeight.toLocaleString()} lbs`],
    ['Total Cost', formatCurrency(totalCost)],
  ];

  children.push(kvTable(summary, brand));

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Bill of Materials',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
