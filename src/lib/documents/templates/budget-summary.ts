/**
 * Budget Summary Document Template
 *
 * Project budget report with phase-by-phase breakdown, deliverables,
 * selected add-ons, invoice status, payment summary, and cash flow.
 */

import {
  Paragraph,
  Table,
  AlignmentType,
} from 'docx';

import type {
  Organization,
  Proposal,
  Client,
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  Invoice,
  InvoicePayment,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  heading,
  body,
  spacer,
  labelValue,
  calloutBox,
  kvTable,
  dataTable,
  formatCurrency,
  formatDate,
  createDocument,
  packDocument,
  CONTENT_WIDTH,
  type DocBrand,
  type TableColumn,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface BudgetSummaryData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  phases: Phase[];
  deliverables: PhaseDeliverable[];
  addons: PhaseAddon[];
  invoices: Invoice[];
  payments: InvoicePayment[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function phaseBudgetTable(
  phases: Phase[],
  deliverables: PhaseDeliverable[],
  brand: DocBrand,
  currency: string
): Table {
  // Collect unique categories across all deliverables
  const categorySet = new Set<string>();
  deliverables.forEach((d) => categorySet.add(d.category));
  const categories = Array.from(categorySet).sort();

  // Build columns: Phase Name, Estimated, then one per category
  const columns: TableColumn[] = [
    { header: 'Phase', width: 2400 },
    { header: 'Estimated', width: 1800, align: AlignmentType.RIGHT },
  ];

  // Distribute remaining width across category columns
  const remainingWidth = CONTENT_WIDTH - 2400 - 1800;
  const catColWidth = categories.length > 0 ? Math.floor(remainingWidth / categories.length) : 0;
  categories.forEach((cat) => {
    columns.push({ header: cat, width: catColWidth, align: AlignmentType.RIGHT });
  });

  const rows = phases.map((phase) => {
    const phaseDeliverables = deliverables.filter((d) => d.phase_id === phase.id);
    const row = [
      `${phase.number}. ${phase.name}`,
      formatCurrency(phase.phase_investment, currency),
    ];
    categories.forEach((cat) => {
      const catTotal = phaseDeliverables
        .filter((d) => d.category === cat)
        .reduce((sum, d) => sum + d.total_cost, 0);
      row.push(catTotal > 0 ? formatCurrency(catTotal, currency) : '-');
    });
    return row;
  });

  return dataTable(columns, rows, brand);
}

function deliverablesBreakdown(
  phases: Phase[],
  deliverables: PhaseDeliverable[],
  brand: DocBrand,
  currency: string
): (Paragraph | Table)[] {
  const parts: (Paragraph | Table)[] = [heading('Deliverables Breakdown', 2)];

  for (const phase of phases) {
    const phaseDeliverables = deliverables
      .filter((d) => d.phase_id === phase.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (phaseDeliverables.length === 0) continue;

    parts.push(body(`Phase ${phase.number}: ${phase.name}`, { bold: true, size: 24, spacing: { before: 200, after: 80 } }));

    const columns: TableColumn[] = [
      { header: 'Deliverable', width: 3600 },
      { header: 'Qty', width: 900, align: AlignmentType.CENTER },
      { header: 'Unit Cost', width: 2200, align: AlignmentType.RIGHT },
      { header: 'Total', width: 2660, align: AlignmentType.RIGHT },
    ];

    const rows = phaseDeliverables.map((d) => [
      d.name,
      d.qty.toString(),
      formatCurrency(d.unit_cost, currency),
      formatCurrency(d.total_cost, currency),
    ]);

    parts.push(dataTable(columns, rows, brand));
  }

  return parts;
}

function selectedAddonsSection(
  phases: Phase[],
  addons: PhaseAddon[],
  brand: DocBrand,
  currency: string
): (Paragraph | Table)[] {
  const selected = addons.filter((a) => a.selected);
  if (selected.length === 0) return [];

  // Build a phase lookup
  const phaseMap = new Map<string, Phase>();
  phases.forEach((p) => phaseMap.set(p.id, p));

  const columns: TableColumn[] = [
    { header: 'Add-On', width: 3600 },
    { header: 'Phase', width: 2400, align: AlignmentType.LEFT },
    { header: 'Cost', width: 3360, align: AlignmentType.RIGHT },
  ];

  const rows = selected.map((a) => {
    const phase = phaseMap.get(a.phase_id);
    return [
      a.name,
      phase ? `${phase.number}. ${phase.name}` : '-',
      formatCurrency(a.total_cost, currency),
    ];
  });

  return [
    heading('Selected Add-Ons', 2),
    dataTable(columns, rows, brand),
    spacer(200),
  ];
}

function invoiceStatusSection(
  invoices: Invoice[],
  brand: DocBrand,
  currency: string
): (Paragraph | Table)[] {
  if (invoices.length === 0) return [];

  const statusColorMap: Record<string, string> = {
    paid: '16A34A',
    partially_paid: 'CA8A04',
    sent: '2563EB',
    viewed: '2563EB',
    overdue: 'DC2626',
    draft: '71717A',
    void: '71717A',
  };

  const columns: TableColumn[] = [
    { header: 'Invoice #', width: 1800 },
    { header: 'Type', width: 1600, align: AlignmentType.CENTER },
    { header: 'Amount', width: 2000, align: AlignmentType.RIGHT },
    { header: 'Status', width: 1800, align: AlignmentType.CENTER },
    { header: 'Paid Date', width: 2160 },
  ];

  const rows = invoices.map((inv) => [
    inv.invoice_number,
    inv.type.replace(/_/g, ' '),
    formatCurrency(inv.total, currency),
    inv.status.replace(/_/g, ' ').toUpperCase(),
    inv.paid_date ? formatDate(inv.paid_date) : '-',
  ]);

  return [
    heading('Invoice Status', 2),
    dataTable(columns, rows, brand),
    spacer(200),
  ];
}

function paymentSummarySection(
  invoices: Invoice[],
  payments: InvoicePayment[],
  brand: DocBrand,
  currency: string
): (Paragraph | Table)[] {
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = totalInvoiced - totalReceived;

  const pairs: Array<[string, string]> = [
    ['Total Invoiced', formatCurrency(totalInvoiced, currency)],
    ['Total Received', formatCurrency(totalReceived, currency)],
    ['Outstanding Balance', formatCurrency(outstanding, currency)],
  ];

  return [
    heading('Payment Summary', 2),
    kvTable(pairs, brand),
    spacer(200),
  ];
}

function cashFlowSection(
  invoices: Invoice[],
  brand: DocBrand,
  currency: string
): (Paragraph | Table)[] {
  const deposits = invoices.filter((i) => i.type === 'deposit');
  const balances = invoices.filter((i) => i.type === 'balance' || i.type === 'final');

  const parts: (Paragraph | Table)[] = [heading('Cash Flow', 2)];

  if (deposits.length > 0) {
    const dep = deposits[0];
    parts.push(labelValue('Deposit Amount', formatCurrency(dep.total, currency), brand));
    if (dep.paid_date) {
      parts.push(labelValue('Deposit Received', formatDate(dep.paid_date), brand));
    } else {
      parts.push(labelValue('Deposit Due', formatDate(dep.due_date), brand));
    }
  }

  if (balances.length > 0) {
    const bal = balances[0];
    parts.push(labelValue('Balance Amount', formatCurrency(bal.total, currency), brand));
    if (bal.paid_date) {
      parts.push(labelValue('Balance Received', formatDate(bal.paid_date), brand));
    } else {
      parts.push(labelValue('Balance Due', formatDate(bal.due_date), brand));
    }
  }

  if (deposits.length === 0 && balances.length === 0) {
    parts.push(body('No deposit or balance invoices recorded.'));
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateBudgetSummary(data: BudgetSummaryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, phases, deliverables, addons, invoices, payments } = data;
  const cur = proposal.currency;

  const children: (Paragraph | Table)[] = [];

  // 1. Header
  children.push(heading('BUDGET SUMMARY', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 200 } }));

  // 2. Project Overview
  children.push(heading('Project Overview', 2));
  const overviewPairs: Array<[string, string]> = [
    ['Client', client.company_name],
    ['Proposal', proposal.name],
    ['Total Value', formatCurrency(proposal.total_value, cur)],
    ['Status', proposal.status.replace(/_/g, ' ').toUpperCase()],
  ];
  children.push(kvTable(overviewPairs, brand));
  children.push(spacer(200));

  // 3. Phase-by-Phase Budget
  children.push(heading('Phase Budget', 2));
  children.push(phaseBudgetTable(phases, deliverables, brand, cur));
  children.push(spacer(200));

  // 4. Deliverables Breakdown
  children.push(...deliverablesBreakdown(phases, deliverables, brand, cur));
  children.push(spacer(200));

  // 5. Selected Add-Ons
  children.push(...selectedAddonsSection(phases, addons, brand, cur));

  // 6. Invoice Status
  children.push(...invoiceStatusSection(invoices, brand, cur));

  // 7. Payment Summary
  children.push(...paymentSummarySection(invoices, payments, brand, cur));

  // 8. Cash Flow
  children.push(...cashFlowSection(invoices, brand, cur));
  children.push(spacer(200));

  // 9. Profitability callout
  const allPaid = invoices.length > 0 && invoices.every((i) => i.status === 'paid' || i.status === 'void');
  if (allPaid) {
    const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    children.push(
      calloutBox(
        `Project fully paid. Total revenue collected: ${formatCurrency(totalReceived, cur)}`,
        brand
      )
    );
  }

  // -- Build document --
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Budget Summary',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
