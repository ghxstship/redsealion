/**
 * Project Closeout Document Template
 *
 * Generates a comprehensive branded project closeout report with
 * financial summary, milestone review, lessons learned, and sign-off.
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

interface MilestoneItem {
  name: string;
  status: string;
  planned_date: string | null;
  actual_date: string | null;
}

interface BudgetCategory {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
}

interface ProjectCloseoutData {
  org: Organization;
  project: {
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
  };
  clientName: string | null;
  projectManager: string | null;
  milestones: MilestoneItem[];
  budgetCategories: BudgetCategory[];
  totalRevenue: number;
  totalExpenses: number;
  lessonsLearned: string | null;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateProjectCloseout(data: ProjectCloseoutData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { project, milestones, budgetCategories } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('PROJECT CLOSEOUT REPORT', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Project', project.name],
    ['Status', project.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  if (project.start_date && project.end_date) {
    metaInfo.push(['Duration', `${formatDate(project.start_date)} \u2013 ${formatDate(project.end_date)}`]);
  }
  if (data.clientName) metaInfo.push(['Client', data.clientName]);
  if (data.projectManager) metaInfo.push(['Project Manager', data.projectManager]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // Financial summary
  const margin = data.totalRevenue - data.totalExpenses;
  const marginPct = data.totalRevenue > 0 ? ((margin / data.totalRevenue) * 100).toFixed(1) : '\u2014';

  children.push(heading('Financial Summary', 2));
  children.push(kvTable([
    ['Total Revenue', formatCurrency(data.totalRevenue)],
    ['Total Expenses', formatCurrency(data.totalExpenses)],
    ['Net Margin', formatCurrency(margin)],
    ['Margin %', typeof marginPct === 'string' ? marginPct + '%' : '\u2014'],
  ], brand));
  children.push(spacer());

  // Budget variance
  if (budgetCategories.length > 0) {
    children.push(heading('Budget vs. Actual', 2));

    const budgetCols: TableColumn[] = [
      { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Budgeted', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Actual', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Variance', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Var. %', width: Math.floor(CONTENT_WIDTH * 0.15) },
    ];

    const budgetRows = budgetCategories.map((b) => [
      b.category,
      formatCurrency(b.budgeted),
      formatCurrency(b.actual),
      formatCurrency(b.variance),
      b.budgeted > 0 ? `${((b.variance / b.budgeted) * 100).toFixed(1)}%` : '\u2014',
    ]);

    children.push(dataTable(budgetCols, budgetRows, brand));
    children.push(spacer());
  }

  // Milestones
  if (milestones.length > 0) {
    children.push(heading('Milestone Review', 2));

    const mileCols: TableColumn[] = [
      { header: 'Milestone', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Planned', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Actual', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const mileRows = milestones.map((m) => [
      m.name,
      m.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      m.planned_date ? formatDate(m.planned_date) : '\u2014',
      m.actual_date ? formatDate(m.actual_date) : '\u2014',
    ]);

    children.push(dataTable(mileCols, mileRows, brand));
    children.push(spacer());
  }

  // Lessons learned
  if (data.lessonsLearned) {
    children.push(heading('Lessons Learned', 2));
    children.push(body(data.lessonsLearned));
    children.push(spacer());
  }

  // Sign-off
  children.push(heading('Closeout Approval', 2));
  children.push(
    body('This project closeout report has been reviewed and approved.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Project Manager', name: data.projectManager ?? undefined },
        { role: 'Client Representative' },
        { role: 'Executive Sponsor' },
      ],
      brand,
    ),
  );

  const section = buildSection({ brand, children, documentTitle: 'Project Closeout Report' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
