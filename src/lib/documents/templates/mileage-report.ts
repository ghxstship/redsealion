/**
 * Mileage Report Document Template
 */
import type { Organization } from '@/types/database';
import { brandFromOrg, buildSection, createDocument, packDocument, heading, body, spacer, dataTable, kvTable, formatCurrency, formatDate, type TableColumn, CONTENT_WIDTH } from '../engine';

interface MileageEntry { date: string; description: string; from_location: string; to_location: string; miles: number; rate: number; total: number; }
interface MileageReportData { org: Organization; employeeName: string; period: { start: string; end: string }; entries: MileageEntry[]; logoBuffer?: Buffer; }

export async function generateMileageReport(data: MileageReportData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('MILEAGE REPORT', 1));
  children.push(spacer(100));
  children.push(kvTable([
    ['Employee', data.employeeName],
    ['Period', `${formatDate(data.period.start)} \u2013 ${formatDate(data.period.end)}`],
    ['Total Entries', String(data.entries.length)],
  ], brand));
  children.push(spacer());

  const cols: TableColumn[] = [
    { header: 'Date', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'From', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'To', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Miles', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Rate', width: Math.floor(CONTENT_WIDTH * 0.13) },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];
  const rows = data.entries.map((e) => [formatDate(e.date), e.description, e.from_location, e.to_location, e.miles.toFixed(1), `$${e.rate.toFixed(3)}`, formatCurrency(e.total)]);
  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  const totalMiles = data.entries.reduce((s, e) => s + e.miles, 0);
  const totalAmount = data.entries.reduce((s, e) => s + e.total, 0);
  children.push(kvTable([['Total Miles', totalMiles.toFixed(1)], ['Total Reimbursement', formatCurrency(totalAmount)]], brand));

  const section = buildSection({ brand, children, documentTitle: 'Mileage Report' });
  return packDocument(createDocument(brand, [section]));
}
