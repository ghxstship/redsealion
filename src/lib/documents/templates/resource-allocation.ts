/**
 * Resource Allocation Document Template
 */
import type { Organization } from '@/types/database';
import { brandFromOrg, buildSection, createDocument, packDocument, heading, body, spacer, dataTable, kvTable, formatDate, type TableColumn, CONTENT_WIDTH } from '../engine';

interface ResourceBooking { resourceName: string; resourceType: string; projectName: string; start_date: string; end_date: string; allocation_pct: number; }
interface ResourceAllocationData { org: Organization; period: { start: string; end: string }; bookings: ResourceBooking[]; logoBuffer?: Buffer; }

export async function generateResourceAllocation(data: ResourceAllocationData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('RESOURCE ALLOCATION REPORT', 1));
  children.push(spacer(100));
  children.push(kvTable([
    ['Period', `${formatDate(data.period.start)} \u2013 ${formatDate(data.period.end)}`],
    ['Total Bookings', String(data.bookings.length)],
    ['Report Date', formatDate(new Date().toISOString())],
  ], brand));
  children.push(spacer());

  // Summary by resource
  const resMap = new Map<string, { type: string; bookings: number; avgAlloc: number }>();
  for (const b of data.bookings) {
    const existing = resMap.get(b.resourceName) ?? { type: b.resourceType, bookings: 0, avgAlloc: 0 };
    existing.bookings += 1;
    existing.avgAlloc = ((existing.avgAlloc * (existing.bookings - 1)) + b.allocation_pct) / existing.bookings;
    resMap.set(b.resourceName, existing);
  }

  if (resMap.size > 0) {
    children.push(heading('Resource Summary', 2));
    const sumCols: TableColumn[] = [
      { header: 'Resource', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Bookings', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Avg. Allocation', width: Math.floor(CONTENT_WIDTH * 0.3) },
    ];
    const sumRows = Array.from(resMap.entries()).map(([name, d]) => [name, d.type, String(d.bookings), `${d.avgAlloc.toFixed(0)}%`]);
    children.push(dataTable(sumCols, sumRows, brand));
    children.push(spacer());
  }

  children.push(heading('Booking Details', 2));
  const cols: TableColumn[] = [
    { header: 'Resource', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Type', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Project', width: Math.floor(CONTENT_WIDTH * 0.22) },
    { header: 'Start', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'End', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Alloc.', width: Math.floor(CONTENT_WIDTH * 0.18) },
  ];
  const rows = data.bookings.map((b) => [b.resourceName, b.resourceType, b.projectName, formatDate(b.start_date), formatDate(b.end_date), `${b.allocation_pct}%`]);
  children.push(dataTable(cols, rows, brand));
  children.push(spacer());
  children.push(body(`Report generated ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }));

  const section = buildSection({ brand, children, documentTitle: 'Resource Allocation Report' });
  return packDocument(createDocument(brand, [section]));
}
