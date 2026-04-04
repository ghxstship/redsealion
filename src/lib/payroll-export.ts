/**
 * Payroll export generators.
 *
 * Generates export files from approved timesheets in CSV, ADP, and Gusto formats.
 *
 * @module lib/payroll-export
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  email: string;
  department: string | null;
  hoursRegular: number;
  hoursOvertime: number;
  hoursBillable: number;
  hoursNonBillable: number;
  totalHours: number;
  hourlyRate: number | null;
  totalPay: number;
  periodStart: string;
  periodEnd: string;
}

export type PayrollFormat = 'csv' | 'adp' | 'gusto';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Generate payroll export in the specified format.
 */
export function generatePayrollExport(
  entries: PayrollEntry[],
  format: PayrollFormat,
): string {
  switch (format) {
    case 'csv':
      return generateCSV(entries);
    case 'adp':
      return generateADPFormat(entries);
    case 'gusto':
      return generateGustoFormat(entries);
    default:
      return generateCSV(entries);
  }
}

/**
 * Standard CSV export.
 */
export function generateCSV(entries: PayrollEntry[]): string {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Email',
    'Department',
    'Regular Hours',
    'Overtime Hours',
    'Billable Hours',
    'Non-Billable Hours',
    'Total Hours',
    'Hourly Rate',
    'Total Pay',
    'Period Start',
    'Period End',
  ];

  const rows = entries.map((e) => [
    e.employeeId,
    `"${e.employeeName}"`,
    e.email,
    e.department ?? '',
    e.hoursRegular.toFixed(2),
    e.hoursOvertime.toFixed(2),
    e.hoursBillable.toFixed(2),
    e.hoursNonBillable.toFixed(2),
    e.totalHours.toFixed(2),
    e.hourlyRate?.toFixed(2) ?? '',
    e.totalPay.toFixed(2),
    e.periodStart,
    e.periodEnd,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * ADP-compatible format.
 * ADP expects: Co Code, Batch ID, File #, Reg Hours, OT Hours, Temp Rate, Earnings 3 Code, Earnings 3 Amount
 */
export function generateADPFormat(entries: PayrollEntry[]): string {
  const headers = [
    'Co Code',
    'Batch ID',
    'File #',
    'Reg Hours',
    'O/T Hours',
    'Temp Rate',
    'Earnings 3 Code',
    'Earnings 3 Amount',
  ];

  const rows = entries.map((e) => [
    '', // Co Code — configured per org
    '', // Batch ID
    e.employeeId,
    e.hoursRegular.toFixed(2),
    e.hoursOvertime.toFixed(2),
    e.hourlyRate?.toFixed(2) ?? '',
    '', // Earnings 3 Code
    '', // Earnings 3 Amount
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Gusto-compatible format.
 * Gusto expects: Employee Email, Hours Worked, Overtime Hours, Pay Rate
 */
export function generateGustoFormat(entries: PayrollEntry[]): string {
  const headers = ['Employee Email', 'Hours Worked', 'Overtime Hours', 'Pay Rate'];

  const rows = entries.map((e) => [
    e.email,
    e.totalHours.toFixed(2),
    e.hoursOvertime.toFixed(2),
    e.hourlyRate?.toFixed(2) ?? '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Get MIME type for the export format.
 */
export function getExportMimeType(_format: PayrollFormat): string {
  return 'text/csv';
}

/**
 * Get file extension for the export format.
 */
export function getExportExtension(_format: PayrollFormat): string {
  return '.csv';
}
