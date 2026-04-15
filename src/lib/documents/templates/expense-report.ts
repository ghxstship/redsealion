/**
 * Expense Report Document Template
 *
 * Generates a branded expense report with categorized expenses,
 * subtotals, and approval chain sign-off.
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

interface ExpenseItem {
  date: string;
  category: string;
  description: string;
  amount: number;
  receipt_attached: boolean;
}

interface ExpenseReportData {
  org: Organization;
  report: {
    period_start: string;
    period_end: string;
    status: string;
  };
  employeeName: string;
  employeeEmail: string;
  projectName?: string;
  expenses: ExpenseItem[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateExpenseReport(data: ExpenseReportData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { report, expenses } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('EXPENSE REPORT', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Report Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Employee', data.employeeName],
    ['Email', data.employeeEmail],
    ['Period', `${formatDate(report.period_start)} \u2013 ${formatDate(report.period_end)}`],
    ['Status', report.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  if (data.projectName) metaInfo.push(['Project', data.projectName]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Expense Table
  // ------------------------------------------------------------------
  children.push(heading('Itemized Expenses', 2));

  const cols: TableColumn[] = [
    { header: 'Date', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.31) },
    { header: 'Amount', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Receipt', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const rows = expenses.map((e) => [
    formatDate(e.date),
    e.category,
    e.description,
    formatCurrency(e.amount),
    e.receipt_attached ? 'Attached' : 'Missing',
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 4. Category Subtotals
  // ------------------------------------------------------------------
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    categoryMap.set(exp.category, (categoryMap.get(exp.category) ?? 0) + exp.amount);
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  children.push(heading('Summary by Category', 2));

  const catCols: TableColumn[] = [
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Amount', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: '% of Total', width: Math.floor(CONTENT_WIDTH * 0.3) },
  ];

  const catRows = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => [
      cat,
      formatCurrency(amount),
      totalAmount > 0 ? `${((amount / totalAmount) * 100).toFixed(1)}%` : '\u2014',
    ]);

  children.push(dataTable(catCols, catRows, brand));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 5. Total
  // ------------------------------------------------------------------
  children.push(heading('Total Reimbursement', 2));

  const totals: Array<[string, string]> = [
    ['Total Expenses', formatCurrency(totalAmount)],
    ['Receipts Attached', `${expenses.filter((e) => e.receipt_attached).length} of ${expenses.length}`],
  ];

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Approval
  // ------------------------------------------------------------------
  children.push(heading('Approval', 2));
  children.push(
    body('I certify that the above expenses were incurred for legitimate business purposes.', {
      spacing: { after: 200 },
    }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Submitted By', name: data.employeeName },
        { role: 'Approved By' },
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
    documentTitle: 'Expense Report',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
