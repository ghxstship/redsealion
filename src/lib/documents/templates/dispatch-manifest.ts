/**
 * Dispatch Manifest Document Template
 */
import type { Organization } from '@/types/database';
import { brandFromOrg, buildSection, createDocument, packDocument, heading, body, spacer, dataTable, kvTable, formatDate, type TableColumn, CONTENT_WIDTH } from '../engine';

interface DispatchStop { sequence: number; location: string; arrival_time: string | null; departure_time: string | null; items: string; notes: string | null; }
interface DispatchManifestData { org: Organization; dispatch: { dispatch_number: string; date: string; driver: string | null; vehicle: string | null; status: string; }; stops: DispatchStop[]; logoBuffer?: Buffer; }

export async function generateDispatchManifest(data: DispatchManifestData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('DISPATCH MANIFEST', 1));
  children.push(spacer(100));
  const meta: Array<[string, string]> = [
    ['Dispatch #', data.dispatch.dispatch_number],
    ['Date', formatDate(data.dispatch.date)],
    ['Status', data.dispatch.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  if (data.dispatch.driver) meta.push(['Driver', data.dispatch.driver]);
  if (data.dispatch.vehicle) meta.push(['Vehicle', data.dispatch.vehicle]);
  meta.push(['Total Stops', String(data.stops.length)]);
  children.push(kvTable(meta, brand));
  children.push(spacer());

  children.push(heading('Route Stops', 2));
  const cols: TableColumn[] = [
    { header: '#', width: Math.floor(CONTENT_WIDTH * 0.06) },
    { header: 'Location', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Arrival', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Departure', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Items', width: Math.floor(CONTENT_WIDTH * 0.22) },
    { header: 'Notes', width: Math.floor(CONTENT_WIDTH * 0.19) },
  ];
  const rows = data.stops.map((s) => [String(s.sequence), s.location, s.arrival_time ?? '\u2014', s.departure_time ?? '\u2014', s.items, s.notes ?? '\u2014']);
  children.push(dataTable(cols, rows, brand));
  children.push(spacer());
  children.push(body(`Manifest generated ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }));

  const section = buildSection({ brand, children, documentTitle: 'Dispatch Manifest' });
  return packDocument(createDocument(brand, [section]));
}
