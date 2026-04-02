/**
 * Generate a CSV string suitable for payroll export.
 */
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
    csvEscape(e.userName),
    csvEscape(e.email),
    String(e.hours),
    String(e.rate),
    csvEscape(e.rateType),
    String(e.total),
    csvEscape(e.projectName ?? ''),
  ]);

  const lines = [headers.join(','), ...rows.map((r) => r.join(','))];
  return lines.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
