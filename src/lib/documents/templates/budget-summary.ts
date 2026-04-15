/**
 * Budget Summary Document Template
 *
 * Generates a branded budget summary showing original vs. current budget,
 * phase breakdowns, change order impacts, expense summary, and invoicing status.
 */

import type {
  Organization,
  Proposal,
  Phase,
  Invoice,
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
  styledBox,
  formatCurrency,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface BudgetSummaryData {
  org: Organization;
  proposal: Proposal;
  phases: Phase[];
  invoices: Invoice[];
  changeOrders: ChangeOrder[];
  expenses: Array<{ category: string; amount: number }>;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateBudgetSummary(data: BudgetSummaryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, phases, invoices, changeOrders, expenses } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('BUDGET SUMMARY', 1));
  children.push(body(proposal.name, { bold: true, size: 26, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Budget Overview
  // ------------------------------------------------------------------
  const totalChangeOrderAmount = changeOrders.reduce(
    (sum, co) => sum + ((co.amount as number) ?? 0),
    0,
  );
  const currentBudget = proposal.total_value + totalChangeOrderAmount;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + ((inv.total as number) ?? 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + ((inv.amount_paid as number) ?? 0), 0);

  children.push(heading('Overview', 2));

  const overview: Array<[string, string]> = [
    ['Original Budget', formatCurrency(proposal.total_value)],
    ['Change Orders', formatCurrency(totalChangeOrderAmount)],
    ['Current Budget', formatCurrency(currentBudget)],
    ['Total Expenses', formatCurrency(totalExpenses)],
    ['Remaining Budget', formatCurrency(currentBudget - totalExpenses)],
  ];

  children.push(kvTable(overview, brand));
  children.push(spacer());

  // Variance callout
  const variance = currentBudget - totalExpenses;
  if (variance < 0) {
    children.push(
      ...styledBox(
        'Budget Alert',
        [`Project is over budget by ${formatCurrency(Math.abs(variance))}`],
        'addon',
        brand,
      ),
    );
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 3. Phase Breakdown
  // ------------------------------------------------------------------
  children.push(heading('Phase Breakdown', 2));

  const phaseCols: TableColumn[] = [
    { header: 'Phase', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.35) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Budget', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: '% of Total', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const phaseRows = phases.map((p) => [
    p.phase_number ?? '',
    p.name,
    (p.status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    formatCurrency(p.phase_investment),
    proposal.total_value > 0
      ? `${((p.phase_investment / proposal.total_value) * 100).toFixed(1)}%`
      : '\u2014',
  ]);

  children.push(dataTable(phaseCols, phaseRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Change Order Summary
  // ------------------------------------------------------------------
  if (changeOrders.length > 0) {
    children.push(heading('Change Orders', 2));

    const coCols: TableColumn[] = [
      { header: '#', width: Math.floor(CONTENT_WIDTH * 0.08) },
      { header: 'Title', width: Math.floor(CONTENT_WIDTH * 0.37) },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Amount', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Date', width: Math.floor(CONTENT_WIDTH * 0.2) },
    ];

    const coRows = changeOrders.map((co) => [
      co.id.substring(0, 8),
      co.title ?? '',
      (co.status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      formatCurrency((co.amount as number) ?? 0),
      formatDate(co.created_at),
    ]);

    children.push(dataTable(coCols, coRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Expense Summary by Category
  // ------------------------------------------------------------------
  if (expenses.length > 0) {
    children.push(heading('Expenses by Category', 2));

    // Aggregate by category
    const categoryMap = new Map<string, number>();
    for (const exp of expenses) {
      categoryMap.set(
        exp.category,
        (categoryMap.get(exp.category) ?? 0) + exp.amount,
      );
    }

    const expCols: TableColumn[] = [
      { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.5) },
      { header: 'Amount', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: '% of Total', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const expRows = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => [
        cat || 'Uncategorized',
        formatCurrency(amount),
        totalExpenses > 0 ? `${((amount / totalExpenses) * 100).toFixed(1)}%` : '\u2014',
      ]);

    children.push(dataTable(expCols, expRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Invoicing Status
  // ------------------------------------------------------------------
  children.push(heading('Invoicing Summary', 2));

  const invoiceSummary: Array<[string, string]> = [
    ['Total Invoiced', formatCurrency(totalInvoiced)],
    ['Total Received', formatCurrency(totalPaid)],
    ['Outstanding', formatCurrency(totalInvoiced - totalPaid)],
    ['Un-invoiced Budget', formatCurrency(currentBudget - totalInvoiced)],
  ];

  children.push(kvTable(invoiceSummary, brand));

  if (invoices.length > 0) {
    children.push(spacer(100));

    const invCols: TableColumn[] = [
      { header: 'Invoice #', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Paid', width: Math.floor(CONTENT_WIDTH * 0.15) },
      { header: 'Due', width: Math.floor(CONTENT_WIDTH * 0.15) },
    ];

    const invRows = invoices.map((inv) => [
      (inv.invoice_number as string) ?? '',
      ((inv.type as string) ?? '').replace(/_/g, ' '),
      ((inv.status as string) ?? '').replace(/_/g, ' '),
      formatCurrency((inv.total as number) ?? 0),
      formatCurrency((inv.amount_paid as number) ?? 0),
      formatDate(inv.due_date),
    ]);

    children.push(dataTable(invCols, invRows, brand));
  }

  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Report Footer
  // ------------------------------------------------------------------
  children.push(
    body(`Report generated ${formatDate(new Date().toISOString())}`, {
      italic: true,
      size: 18,
      color: 'A1A1AA',
    }),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Budget Summary',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
