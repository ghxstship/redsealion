/**
 * Daily Report Document Template
 *
 * Generates a branded daily field report with labor summary,
 * deliveries, work narrative, issues, and supervisor sign-off.
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
  kvTable,
  signatureBlock,
  formatDate,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface DailyReportData {
  org: Organization;
  report: {
    report_date: string;
    labor_hours: number;
    crew_count: number;
    deliveries_received: number;
    notes: string | null;
    status: string;
  };
  eventName: string;
  filedByName: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateDailyReport(data: DailyReportData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { report } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('DAILY REPORT', 1));
  children.push(spacer(100));

  // ------------------------------------------------------------------
  // 2. Report Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Date', formatDate(report.report_date)],
    ['Event', data.eventName],
    ['Filed By', data.filedByName],
    ['Status', report.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];
  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Labor Summary
  // ------------------------------------------------------------------
  children.push(heading('Labor Summary', 2));

  const laborInfo: Array<[string, string]> = [
    ['Total Labor Hours', String(report.labor_hours)],
    ['Crew Count', String(report.crew_count)],
    ['Avg Hours per Person', report.crew_count > 0 ? (report.labor_hours / report.crew_count).toFixed(1) : '\u2014'],
  ];
  children.push(kvTable(laborInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Deliveries
  // ------------------------------------------------------------------
  children.push(heading('Deliveries', 2));
  children.push(
    labelValue('Deliveries Received', String(report.deliveries_received), brand),
  );
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Notes / Work Narrative
  // ------------------------------------------------------------------
  if (report.notes) {
    children.push(heading('Work Summary & Notes', 2));
    const paragraphs = report.notes.split('\n').filter((p) => p.trim());
    for (const para of paragraphs) {
      children.push(body(para, { spacing: { after: 100 } }));
    }
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Issues / Delays Section (blank for filling)
  // ------------------------------------------------------------------
  children.push(heading('Issues & Delays', 2));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Safety Incidents
  // ------------------------------------------------------------------
  children.push(heading('Safety Incidents', 2));
  children.push(
    calloutBox('No incidents reported', brand),
  );
  children.push(spacer());

  // ------------------------------------------------------------------
  // 8. Sign-Off
  // ------------------------------------------------------------------
  children.push(heading('Supervisor Sign-Off', 2));
  children.push(
    body('I confirm that the information in this report is accurate.', { spacing: { after: 200 } }),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Site Supervisor' },
        { role: 'Project Manager' },
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
    documentTitle: 'Daily Report',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
