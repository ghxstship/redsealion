/**
 * Change Order Document Template
 *
 * Generates a branded change order with scope additions/removals,
 * financial impact, schedule impact, and dual approval signatures.
 */

import type {
  Organization,
  Proposal,
  Client,
  ChangeOrder,
} from '@/types/database';

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
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';


/// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface ChangeOrderData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  changeOrder: ChangeOrder;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateChangeOrder(data: ChangeOrderData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client } = data;
  // Use flexible record for fields that may or may not be present on the DB type
  const co = data.changeOrder as unknown as Record<string, unknown>;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('CHANGE ORDER', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Change Order metadata
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Change Order #', String(co.number ?? co.id ?? '')],
    ['Project', proposal.name],
    ['Client', client.company_name ?? ''],
    ['Status', ((co.status as string) ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Date', formatDate(co.created_at as string)],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Title & Description
  // ------------------------------------------------------------------
  if (co.title) {
    children.push(heading(co.title as string, 2));
  }
  if (co.description) {
    children.push(body(co.description as string, { spacing: { after: 120 } }));
  }
  if (co.reason) {
    children.push(labelValue('Reason', co.reason as string, brand));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Financial Impact
  // ------------------------------------------------------------------
  children.push(heading('Financial Impact', 2));

  const amount = (co.amount as number) ?? 0;
  const originalValue = (co.original_value as number) ?? proposal.total_value ?? 0;
  const netChange = (co.net_change as number) ?? amount;
  const revisedValue = (co.revised_value as number) ?? originalValue + netChange;

  const financials: Array<[string, string]> = [
    ['Original Contract Value', formatCurrency(originalValue)],
    ['This Change Order', formatCurrency(amount)],
    ['Net Change', formatCurrency(netChange)],
    ['Revised Contract Value', formatCurrency(revisedValue)],
  ];

  children.push(kvTable(financials, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Schedule Impact
  // ------------------------------------------------------------------
  const schedImpact = co.schedule_impact_days as number | null;
  if (schedImpact) {
    children.push(heading('Schedule Impact', 2));
    children.push(
      calloutBox(
        `Schedule impact: ${schedImpact} day(s)`,
        brand,
      ),
    );
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Scope Additions
  // ------------------------------------------------------------------
  const additions = (co.scope_additions as unknown[]) ?? [];
  if (additions.length > 0) {
    children.push(heading('Scope Additions', 2));
    const addCols: TableColumn[] = [
      { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.4) },
      { header: 'Phase', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
      { header: 'Unit Cost', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.2) },
    ];
    const addRows = additions.map((item) => {
      const a = item as { description: string; phase_number?: string | null; qty: number; unit_cost: number; total: number };
      return [
        a.description ?? '',
        a.phase_number ?? '',
        String(a.qty ?? 1),
        formatCurrency(a.unit_cost ?? 0),
        formatCurrency(a.total ?? 0),
      ];
    });
    children.push(dataTable(addCols, addRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Scope Removals
  // ------------------------------------------------------------------
  const removals = (co.scope_removals as unknown[]) ?? [];
  if (removals.length > 0) {
    children.push(heading('Scope Removals', 2));
    const remCols: TableColumn[] = [
      { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.4) },
      { header: 'Phase', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
      { header: 'Unit Cost', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Credit', width: Math.floor(CONTENT_WIDTH * 0.2) },
    ];
    const remRows = removals.map((item) => {
      const r = item as { description: string; phase_number?: string | null; qty: number; unit_cost: number; total: number };
      return [
        r.description ?? '',
        r.phase_number ?? '',
        String(r.qty ?? 1),
        formatCurrency(r.unit_cost ?? 0),
        `(${formatCurrency(r.total ?? 0)})`,
      ];
    });
    children.push(dataTable(remCols, remRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 8. Approval Signatures
  // ------------------------------------------------------------------
  children.push(heading('Approval', 2));
  children.push(
    body(
      'By signing below, both parties agree to the scope modifications and revised contract value described in this change order.',
      { spacing: { after: 200 } },
    ),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Client Representative', name: client.company_name ?? '' },
        { role: 'Project Manager', name: data.org.name },
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
    documentTitle: `Change Order #${co.number ?? ''}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}

