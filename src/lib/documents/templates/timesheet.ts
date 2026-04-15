/**
 * Timesheet Document Template
 *
 * Generates a branded weekly/bi-weekly timesheet document with daily
 * hours breakdown, project allocation, and approval sign-off.
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
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface TimesheetEntry {
  date: string;
  projectName: string;
  taskDescription: string;
  hours: number;
  isBillable: boolean;
}

interface TimesheetData {
  org: Organization;
  period: {
    start: string;
    end: string;
  };
  employee: {
    name: string;
    email: string;
    role: string | null;
  };
  entries: TimesheetEntry[];
  status: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateTimesheet(data: TimesheetData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { period, employee, entries, status } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('TIMESHEET', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Employee & Period Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Employee', employee.name],
    ['Email', employee.email],
    ['Role', employee.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '\u2014'],
    ['Period', `${formatDate(period.start)} \u2013 ${formatDate(period.end)}`],
    ['Status', status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Daily Time Entries
  // ------------------------------------------------------------------
  children.push(heading('Time Entries', 2));

  const entryCols: TableColumn[] = [
    { header: 'Date', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Project', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Hours', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Billable', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];

  const entryRows = entries.map((e) => [
    formatDate(e.date),
    e.projectName,
    e.taskDescription,
    e.hours.toFixed(1),
    e.isBillable ? 'Yes' : 'No',
  ]);

  children.push(dataTable(entryCols, entryRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Project Allocation Summary
  // ------------------------------------------------------------------
  const projectMap = new Map<string, { total: number; billable: number; nonBillable: number }>();
  for (const entry of entries) {
    const existing = projectMap.get(entry.projectName);
    if (existing) {
      existing.total += entry.hours;
      if (entry.isBillable) existing.billable += entry.hours;
      else existing.nonBillable += entry.hours;
    } else {
      projectMap.set(entry.projectName, {
        total: entry.hours,
        billable: entry.isBillable ? entry.hours : 0,
        nonBillable: entry.isBillable ? 0 : entry.hours,
      });
    }
  }

  if (projectMap.size > 0) {
    children.push(heading('Project Allocation', 2));

    const projCols: TableColumn[] = [
      { header: 'Project', width: Math.floor(CONTENT_WIDTH * 0.35) },
      { header: 'Billable', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Non-Billable', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const projRows = Array.from(projectMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, d]) => [
        name,
        d.billable.toFixed(1),
        d.nonBillable.toFixed(1),
        d.total.toFixed(1),
      ]);

    children.push(dataTable(projCols, projRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Totals
  // ------------------------------------------------------------------
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entries.filter((e) => e.isBillable).reduce((sum, e) => sum + e.hours, 0);
  const nonBillableHours = totalHours - billableHours;

  children.push(heading('Summary', 2));

  const totals: Array<[string, string]> = [
    ['Total Hours', totalHours.toFixed(1)],
    ['Billable Hours', billableHours.toFixed(1)],
    ['Non-Billable Hours', nonBillableHours.toFixed(1)],
    ['Utilization', totalHours > 0 ? `${((billableHours / totalHours) * 100).toFixed(0)}%` : '\u2014'],
  ];

  children.push(kvTable(totals, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Sign-off
  // ------------------------------------------------------------------
  children.push(heading('Approval', 2));
  children.push(
    body('I certify that the hours recorded above are accurate and complete.', {
      spacing: { after: 200 },
    }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Employee', name: employee.name },
        { role: 'Manager' },
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
    documentTitle: 'Timesheet',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
