/**
 * Generate a CSV string suitable for payroll export.
 * Uses the canonical buildCsvString SSOT from lib/export-formats.
 */
import { buildCsvString } from '@/lib/export-formats';

export function generatePayrollCSV(opts: {
  orgId: string;
  periodStart: string;
  periodEnd: string;
  entries: Array<{
    userName: string;
    email: string;
    hours: number;
    rate: number;
    rateType: string;
    total: number;
    projectName?: string;
  }>;
}): string {
  const headers = [
    'Employee Name',
    'Email',
    'Hours',
    'Rate',
    'Rate Type',
    'Total',
    'Project',
  ];

  const rows = opts.entries.map((e) => [
    e.userName,
    e.email,
    String(e.hours),
    String(e.rate),
    e.rateType,
    String(e.total),
    e.projectName ?? '',
  ]);

  return buildCsvString(headers, rows);
}

