/**
 * Payroll Summary Document Template
 *
 * Generates a branded payroll summary with employee breakdowns,
 * project allocations, totals, and authorization sign-off.
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

interface PayrollEntry {
  userName: string;
  email: string;
  hours: number;
  rate: number;
  rateType: string;
  total: number;
  projectName?: string;
}

interface PayrollSummaryData {
  org: Organization;
  period: {
    start: string;
    end: string;
  };
  entries: PayrollEntry[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generatePayrollSummary(data: PayrollSummaryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { period, entries } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('PAYROLL SUMMARY', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Period Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Pay Period', `${formatDate(period.start)} \u2013 ${formatDate(period.end)}`],
    ['Organization', data.org.name],
    ['Total Employees', String(new Set(entries.map((e) => e.email)).size)],
    ['Report Generated', formatDate(new Date().toISOString())],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Employee Summary Table
  // ------------------------------------------------------------------
  children.push(heading('Employee Breakdown', 2));

  // Aggregate by employee
  const employeeMap = new Map<string, { name: string; email: string; hours: number; total: number; rate: number; rateType: string }>();
  for (const entry of entries) {
    const existing = employeeMap.get(entry.email);
    if (existing) {
      existing.hours += entry.hours;
      existing.total += entry.total;
    } else {
      employeeMap.set(entry.email, {
        name: entry.userName,
        email: entry.email,
        hours: entry.hours,
        total: entry.total,
        rate: entry.rate,
        rateType: entry.rateType,
      });
    }
  }

  const empCols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Email', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Hours', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Rate', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];

  const empRows = Array.from(employeeMap.values())
    .sort((a, b) => b.total - a.total)
    .map((emp) => [
      emp.name,
      emp.email,
      emp.hours.toFixed(1),
      formatCurrency(emp.rate),
      emp.rateType,
      formatCurrency(emp.total),
    ]);

  children.push(dataTable(empCols, empRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Project Allocation
  // ------------------------------------------------------------------
  const projectMap = new Map<string, { hours: number; total: number }>();
  for (const entry of entries) {
    const proj = entry.projectName ?? 'Unallocated';
    const existing = projectMap.get(proj);
    if (existing) {
      existing.hours += entry.hours;
      existing.total += entry.total;
    } else {
      projectMap.set(proj, { hours: entry.hours, total: entry.total });
    }
  }

  if (projectMap.size > 0) {
    children.push(heading('Project Allocation', 2));

    const projCols: TableColumn[] = [
      { header: 'Project', width: Math.floor(CONTENT_WIDTH * 0.4) },
      { header: 'Hours', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Cost', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: '% of Total', width: Math.floor(CONTENT_WIDTH * 0.2) },
    ];

    const totalCost = entries.reduce((sum, e) => sum + e.total, 0);

    const projRows = Array.from(projectMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([proj, data]) => [
        proj,
        data.hours.toFixed(1),
        formatCurrency(data.total),
        totalCost > 0 ? `${((data.total / totalCost) * 100).toFixed(1)}%` : '\u2014',
      ]);

    children.push(dataTable(projCols, projRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Grand Totals
  // ------------------------------------------------------------------
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.total, 0);

  children.push(heading('Totals', 2));

  const totals: Array<[string, string]> = [
    ['Total Hours', totalHours.toFixed(1)],
    ['Total Payroll Cost', formatCurrency(totalCost)],
    ['Average Hourly Cost', totalHours > 0 ? formatCurrency(totalCost / totalHours) : '\u2014'],
  ];

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Authorization
  // ------------------------------------------------------------------
  children.push(heading('Authorization', 2));
  children.push(
    body('This payroll summary is authorized for processing.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [{ role: 'Authorized By', name: data.org.name }],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Payroll Summary',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
