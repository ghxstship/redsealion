/**
 * Fabrication Order Document Template
 */
import type { Organization } from '@/types/database';
import { brandFromOrg, buildSection, createDocument, packDocument, heading, body, spacer, dataTable, kvTable, signatureBlock, formatCurrency, formatDate, type TableColumn, CONTENT_WIDTH } from '../engine';

interface FabItem { name: string; quantity: number; material: string | null; status: string; estimated_hours: number | null; }
interface FabricationOrderData { org: Organization; order: { order_number: string; status: string; due_date: string | null; }; projectName: string | null; items: FabItem[]; logoBuffer?: Buffer; }

export async function generateFabricationOrder(data: FabricationOrderData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('FABRICATION ORDER', 1));
  children.push(spacer(100));
  const meta: Array<[string, string]> = [
    ['Order #', data.order.order_number],
    ['Status', data.order.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  if (data.order.due_date) meta.push(['Due Date', formatDate(data.order.due_date)]);
  if (data.projectName) meta.push(['Project', data.projectName]);
  children.push(kvTable(meta, brand));
  children.push(spacer());

  children.push(heading('Items to Fabricate', 2));
  const cols: TableColumn[] = [
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Material', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Est. Hours', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];
  const rows = data.items.map((i) => [i.name, String(i.quantity), i.material ?? '\u2014', i.estimated_hours ? String(i.estimated_hours) : '\u2014', i.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())]);
  children.push(dataTable(cols, rows, brand));
  children.push(spacer());

  children.push(heading('Authorization', 2));
  children.push(...signatureBlock([{ role: 'Shop Manager' }, { role: 'Project Lead' }], brand));

  const section = buildSection({ brand, children, documentTitle: 'Fabrication Order' });
  return packDocument(createDocument(brand, [section]));
}
