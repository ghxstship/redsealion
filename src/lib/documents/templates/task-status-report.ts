/**
 * Task Status Report Document Template
 *
 * Generates a branded task status report grouped by status, phase, and assignee.
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
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

interface TaskItem {
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  due_date: string | null;
  phase: string | null;
}

interface TaskStatusReportData {
  org: Organization;
  projectName: string | null;
  tasks: TaskItem[];
  logoBuffer?: Buffer;
}

export async function generateTaskStatusReport(data: TaskStatusReportData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { tasks } = data;
  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  children.push(heading('TASK STATUS REPORT', 1));
  children.push(spacer(100));

  const metaInfo: Array<[string, string]> = [
    ['Organization', data.org.name],
    ['Report Date', formatDate(new Date().toISOString())],
    ['Total Tasks', String(tasks.length)],
  ];
  if (data.projectName) metaInfo.push(['Project', data.projectName]);
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // Status summary
  const statusMap = new Map<string, number>();
  for (const t of tasks) statusMap.set(t.status, (statusMap.get(t.status) ?? 0) + 1);
  children.push(heading('Status Summary', 2));
  children.push(kvTable(
    Array.from(statusMap.entries()).map(([s, c]) => [s.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()), String(c)]),
    brand,
  ));
  children.push(spacer());

  // Task table
  children.push(heading('Task Listing', 2));
  const cols: TableColumn[] = [
    { header: 'Task', width: Math.floor(CONTENT_WIDTH * 0.28) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Priority', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Assignee', width: Math.floor(CONTENT_WIDTH * 0.18) },
    { header: 'Due Date', width: Math.floor(CONTENT_WIDTH * 0.14) },
    { header: 'Phase', width: Math.floor(CONTENT_WIDTH * 0.14) },
  ];
  const rows = tasks.map((t) => [
    t.title,
    t.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    t.priority.replace(/\b\w/g, (c) => c.toUpperCase()),
    t.assignee ?? '\u2014',
    t.due_date ? formatDate(t.due_date) : '\u2014',
    t.phase ?? '\u2014',
  ]);
  children.push(dataTable(cols, rows, brand));

  children.push(spacer());
  children.push(body(`Report generated ${formatDate(new Date().toISOString())}.`, { spacing: { after: 200 } }));

  const section = buildSection({ brand, children, documentTitle: 'Task Status Report' });
  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
