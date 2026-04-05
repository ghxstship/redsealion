/**
 * Change Order Document Template
 *
 * Formal change order showing scope additions/removals, financial impact,
 * schedule impact, and a signature block for approval.
 */

import {
  Paragraph,
  Table,
  AlignmentType,
} from 'docx';

import type {
  Organization,
  ChangeOrder,
  ChangeOrderLineItem,
  Proposal,
  Client,
  ClientContact,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  heading,
  body,
  spacer,
  labelValue,
  kvTable,
  dataTable,
  signatureBlock,
  formatCurrency,
  formatDate,
  createDocument,
  packDocument,
  type DocBrand,
  type TableColumn,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ChangeOrderDocumentData {
  org: Organization;
  changeOrder: ChangeOrder;
  proposal: Proposal;
  client: Client;
  clientContact: ClientContact | null;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scopeTable(
  label: string,
  items: ChangeOrderLineItem[],
  brand: DocBrand,
  currency: string
): (Paragraph | Table)[] {
  if (items.length === 0) return [];

  const columns: TableColumn[] = [
    { header: 'Description', width: 3400 },
    { header: 'Phase', width: 1000, align: AlignmentType.CENTER },
    { header: 'Qty', width: 900, align: AlignmentType.CENTER },
    { header: 'Unit Cost', width: 2000, align: AlignmentType.RIGHT },
    { header: 'Total', width: 2060, align: AlignmentType.RIGHT },
  ];

  const rows = items.map((item) => [
    item.description,
    item.phase_number ?? '-',
    item.qty.toString(),
    formatCurrency(item.unit_cost, currency),
    formatCurrency(item.total, currency),
  ]);

  return [
    heading(label, 2),
    dataTable(columns, rows, brand),
    spacer(200),
  ];
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateChangeOrderDocument(data: ChangeOrderDocumentData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { changeOrder, proposal, client } = data;
  const cur = proposal.currency;

  const children: (Paragraph | Table)[] = [];

  // 1. Header
  children.push(heading(`CHANGE ORDER #${changeOrder.number}`, 1));

  // 2. Metadata
  const metaPairs: Array<[string, string]> = [
    ['CO Number', `#${changeOrder.number}`],
    ['Date', formatDate(changeOrder.created_at)],
    ['Status', changeOrder.status.toUpperCase()],
    ['Related Proposal', proposal.name],
  ];
  children.push(kvTable(metaPairs, brand));
  children.push(spacer(200));

  // 3. Project Reference
  children.push(heading('Project Reference', 2));
  children.push(labelValue('Proposal', proposal.name, brand));
  children.push(labelValue('Client', client.company_name, brand));
  children.push(labelValue('Original Value', formatCurrency(changeOrder.original_value, cur), brand));
  children.push(spacer(200));

  // 4. Description of Change
  children.push(heading('Description of Change', 2));
  children.push(body(changeOrder.description ?? 'No description provided.'));
  children.push(spacer(200));

  // 5. Reason for Change
  children.push(heading('Reason for Change', 2));
  children.push(body(changeOrder.reason ?? 'No reason specified.'));
  children.push(spacer(200));

  // 6. Scope Additions
  children.push(...scopeTable('Scope Additions', changeOrder.scope_additions ?? [], brand, cur));

  // 7. Scope Removals
  children.push(...scopeTable('Scope Removals', changeOrder.scope_removals ?? [], brand, cur));

  // 8. Financial Impact
  children.push(heading('Financial Impact', 2));
  const additionsTotal = (changeOrder.scope_additions ?? []).reduce((s, i) => s + i.total, 0);
  const removalsTotal = (changeOrder.scope_removals ?? []).reduce((s, i) => s + i.total, 0);
  const financePairs: Array<[string, string]> = [
    ['Original Value', formatCurrency(changeOrder.original_value, cur)],
    ['Additions', formatCurrency(additionsTotal, cur)],
    ['Removals', formatCurrency(removalsTotal, cur)],
    ['Net Change', formatCurrency(changeOrder.net_change, cur)],
    ['Revised Value', formatCurrency(changeOrder.revised_value, cur)],
  ];
  children.push(kvTable(financePairs, brand));
  children.push(spacer(200));

  // 9. Schedule Impact
  children.push(heading('Schedule Impact', 2));
  const scheduleText =
    changeOrder.schedule_impact_days != null && changeOrder.schedule_impact_days !== 0
      ? `${changeOrder.schedule_impact_days} days`
      : 'No schedule impact';
  children.push(body(scheduleText));
  children.push(spacer(300));

  // 10. Signature block
  children.push(...signatureBlock(brand, client.company_name));

  // -- Build document --
  const section = buildSection({
    brand,
    children,
    documentTitle: `Change Order #${changeOrder.number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
