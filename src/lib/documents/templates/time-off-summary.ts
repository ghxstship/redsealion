/**
 * Time Off Summary Document Template
 */
import type { Organization } from '@/types/database';
import { brandFromOrg, buildSection, createDocument, packDocument, heading, spacer, dataTable, kvTable, formatDate, type TableColumn, CONTENT_WIDTH } from '../engine';

interface TimeOffEntry { employeeName: string; type: string; start_date: string; end_date: string; status: string; days: number; }
interface TimeOffSummaryData { org: Organization; period: { start: string; end: string }; entries: TimeOffEntry[]; logoBuffer?: Buffer; }

export async function generateTimeOffSummary(data: TimeOffSummaryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('TIME OFF SUMMARY', 1));
  children.push(spacer(100));
  children.push(kvTable([
    ['Period', `${formatDate(data.period.start)} \u2013 ${formatDate(data.period.end)}`],
    ['Total Requests', String(data.entries.length)],
    ['Total Days', String(data.entries.reduce((s, e) => s + e.days, 0))],
  ], brand));
  children.push(spacer());

  const cols: TableColumn[] = [
    { header: 'Employee', width: Math.floor(CONTENT_WIDTH * 0.22) },
    { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Start', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'End', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Days', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.23) },
  ];
  const rows = data.entries.map((e) => [e.employeeName, e.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), formatDate(e.start_date), formatDate(e.end_date), String(e.days), e.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())]);
  children.push(dataTable(cols, rows, brand));

  const section = buildSection({ brand, children, documentTitle: 'Time Off Summary' });
  return packDocument(createDocument(brand, [section]));
}
