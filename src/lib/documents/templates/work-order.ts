/**
 * Work Order Document Template
 *
 * Generates a branded work order with location, schedule,
 * scope description, crew roster, checklist, and sign-off.
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
  labelValue,
  calloutBox,
  checkbox,
  dataTable,
  kvTable,
  signatureBlock,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface WorkOrderData {
  org: Organization;
  workOrder: {
    wo_number: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    location_name: string | null;
    location_address: string | null;
    scheduled_start: string | null;
    scheduled_end: string | null;
    checklist: Array<{ label: string; checked?: boolean }>;
  };
  assignedCrew: Array<{ name: string; role?: string; phone?: string }>;
  projectName?: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateWorkOrder(data: WorkOrderData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { workOrder, assignedCrew } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('WORK ORDER', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Work Order Info
  // ------------------------------------------------------------------
  const priorityLabel = workOrder.priority.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const statusLabel = workOrder.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const metaInfo: Array<[string, string]> = [
    ['WO Number', workOrder.wo_number],
    ['Title', workOrder.title],
    ['Priority', priorityLabel],
    ['Status', statusLabel],
  ];
  if (data.projectName) metaInfo.push(['Project', data.projectName]);

  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Location
  // ------------------------------------------------------------------
  if (workOrder.location_name || workOrder.location_address) {
    children.push(heading('Location', 2));
    if (workOrder.location_name) children.push(labelValue('Name', workOrder.location_name, brand));
    if (workOrder.location_address) children.push(labelValue('Address', workOrder.location_address, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 4. Schedule
  // ------------------------------------------------------------------
  if (workOrder.scheduled_start || workOrder.scheduled_end) {
    children.push(heading('Schedule', 2));
    if (workOrder.scheduled_start) children.push(labelValue('Start', formatDate(workOrder.scheduled_start), brand));
    if (workOrder.scheduled_end) children.push(labelValue('End', formatDate(workOrder.scheduled_end), brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Description / Scope
  // ------------------------------------------------------------------
  if (workOrder.description) {
    children.push(heading('Scope of Work', 2));
    const paragraphs = workOrder.description.split('\n').filter((p) => p.trim());
    for (const para of paragraphs) {
      children.push(body(para, { spacing: { after: 100 } }));
    }
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Assigned Crew
  // ------------------------------------------------------------------
  if (assignedCrew.length > 0) {
    children.push(heading('Assigned Crew', 2));

    const crewCols: TableColumn[] = [
      { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.35) },
      { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Phone', width: Math.floor(CONTENT_WIDTH * 0.35) },
    ];

    const crewRows = assignedCrew.map((c) => [
      c.name,
      c.role ?? '',
      c.phone ?? '',
    ]);

    children.push(dataTable(crewCols, crewRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Checklist
  // ------------------------------------------------------------------
  if (workOrder.checklist.length > 0) {
    children.push(heading('Checklist', 2));

    for (const item of workOrder.checklist) {
      children.push(checkbox(item.label, item.checked ?? false));
    }

    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 8. Notes Section
  // ------------------------------------------------------------------
  children.push(heading('Field Notes', 2));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 9. Completion Sign-Off
  // ------------------------------------------------------------------
  children.push(heading('Completion', 2));
  children.push(
    body('Work has been completed as described above.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Completed By' },
        { role: 'Verified By' },
      ],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: `WO ${workOrder.wo_number}`,
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
