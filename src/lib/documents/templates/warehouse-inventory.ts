/**
 * Warehouse Inventory Document Template
 */
import type { Organization } from '@/types/database';
import { brandFromOrg, buildSection, createDocument, packDocument, heading, body, spacer, dataTable, kvTable, formatDate, type TableColumn, CONTENT_WIDTH } from '../engine';

interface WarehouseItem { name: string; category: string; zone: string | null; location: string | null; quantity: number; status: string; }
interface WarehouseInventoryData { org: Organization; warehouseName: string | null; items: WarehouseItem[]; logoBuffer?: Buffer; }

export async function generateWarehouseInventory(data: WarehouseInventoryData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('WAREHOUSE INVENTORY', 1));
  children.push(spacer(100));
  children.push(kvTable([
    ['Organization', data.org.name],
    ['Warehouse', data.warehouseName ?? 'All Locations'],
    ['Total Items', String(data.items.length)],
    ['Report Date', formatDate(new Date().toISOString())],
  ], brand));
  children.push(spacer());

  const cols: TableColumn[] = [
    { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Zone', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Location', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.23) },
  ];
  const rows = data.items.map((i) => [i.name, i.category, i.zone ?? '\u2014', i.location ?? '\u2014', String(i.quantity), i.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())]);
  children.push(dataTable(cols, rows, brand));
  children.push(spacer());
  children.push(body(`Inventory report generated ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }));

  const section = buildSection({ brand, children, documentTitle: 'Warehouse Inventory' });
  return packDocument(createDocument(brand, [section]));
}
