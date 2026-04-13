
/**
 * Crew Call Sheet Document
 *
 * Generates a single-day crew call sheet for a specific venue with
 * crew roster, venue details, day schedule, and safety briefing.
 */

import type {
  Organization,
  Proposal,
  Venue,
  TeamAssignment,
  User,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  bullet,
  labelValue,
  calloutBox,
  dataTable,
  kvTable,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import {
  castDocAddress,
  castDocContact,
  castLoadInStrikeEntry,
  castActivationDates,
  type DocVenueLoadInStrike,
  type DocVenueActivationDates,
  type DocVenueContact,
} from '../doc-types';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface CrewCallSheetData {
  org: Organization;
  proposal: Proposal;
  venue: Venue;
  teamAssignments: Array<TeamAssignment & { user: User }>;
  date: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAddress(addr: { street?: string; city?: string; state?: string; zip?: string } | null): string {
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateCrewCallSheet(data: CrewCallSheetData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, venue, teamAssignments, date } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header + Date
  // ------------------------------------------------------------------
  children.push(heading('CREW CALL SHEET', 1));
  children.push(body(formatDate(date), { bold: true, size: 28, spacing: { after: 80 } }));
  children.push(body(proposal.name, { italic: true, color: brand.secondaryColor, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Project + Venue Info
  // ------------------------------------------------------------------
  children.push(heading('Project & Venue', 2));

  const projectInfo: Array<[string, string]> = [
    ['Project', proposal.name],
    ['Venue', venue.name ?? ''],
    ['Address', formatAddress(castDocAddress(venue.address))],
    ['Venue Type', venue.type ?? ''],
  ];

  children.push(kvTable(projectInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Venue Details: contact_on_site
  // ------------------------------------------------------------------
  children.push(heading('Venue Contact', 3));

  const siteContact = castDocContact(venue.contact_on_site);
  if (siteContact) {
    children.push(labelValue('Name', siteContact.name ?? '', brand));
    children.push(labelValue('Phone', siteContact.phone ?? '', brand));
    children.push(labelValue('Email', siteContact.email ?? '', brand));
  } else {
    children.push(body('No on-site contact specified.', { italic: true }));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Load-In / Strike times for the day
  // ------------------------------------------------------------------
  children.push(heading('Schedule Times', 2));

  const loadIn = castLoadInStrikeEntry(venue.load_in);
  if (loadIn) {
    children.push(
      labelValue(
        'Load-In',
        `${formatDate(loadIn.date ?? '')}: ${loadIn.startTime ?? ''} \u2013 ${loadIn.endTime ?? ''}`,
        brand,
      ),
    );
  }

  const strike = castLoadInStrikeEntry(venue.strike);
  if (strike) {
    children.push(
      labelValue(
        'Strike',
        `${formatDate(strike.date ?? '')}: ${strike.startTime ?? ''} \u2013 ${strike.endTime ?? ''}`,
        brand,
      ),
    );
  }

  const actDates = castActivationDates(venue.activation_dates);
  if (actDates) {
    children.push(
      labelValue(
        'Activation',
        `${formatDate(actDates.start ?? '')} \u2013 ${formatDate(actDates.end ?? '')}`,
        brand,
      ),
    );
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Crew Roster
  // ------------------------------------------------------------------
  children.push(heading('Crew Roster', 2));

  const rosterCols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Phone', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Email', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Call Time', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Wrap Time', width: Math.floor(CONTENT_WIDTH * 0.15) },
  ];

  const rosterRows = teamAssignments.map((ta) => [
    ta.user.full_name,
    ta.role,
    ta.user.phone ?? '',
    ta.user.email,
    '', // Call Time - blank for filling in
    '', // Wrap Time - blank for filling in
  ]);

  if (rosterRows.length > 0) {
    children.push(dataTable(rosterCols, rosterRows, brand));
  } else {
    children.push(body('No crew members assigned.', { italic: true }));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Safety Briefing
  // ------------------------------------------------------------------
  children.push(heading('Safety Briefing', 2));
  children.push(
    calloutBox(
      'A safety briefing is required before any work begins. All crew must acknowledge PPE requirements and emergency procedures.',
      brand,
      '\u26A0\uFE0F',
    ),
  );
  children.push(spacer(80));
  children.push(body('PPE Requirements:', { bold: true }));
  children.push(bullet('Hard hat in active work zones'));
  children.push(bullet('Steel-toed boots'));
  children.push(bullet('High-visibility vest'));
  children.push(bullet('Gloves when handling materials'));
  children.push(spacer(80));
  children.push(body('Emergency Contacts:', { bold: true }));
  children.push(bullet('Emergency Services: 911'));
  children.push(bullet('Site Supervisor: ________________________________'));
  children.push(bullet('Nearest Hospital: ________________________________'));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 7. Day Schedule
  // ------------------------------------------------------------------
  children.push(heading('Day Schedule', 2));

  const scheduleCols: TableColumn[] = [
    { header: 'Time', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Activity', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Notes', width: Math.floor(CONTENT_WIDTH * 0.4) },
  ];

  const scheduleRows: string[][] = [];

  // Pre-fill with known times
  if (loadIn) {
    scheduleRows.push([loadIn.startTime ?? '', 'Load-In Begins', '']);
  }

  if (actDates) {
    scheduleRows.push(['\u2014', 'Activation Start', formatDate(actDates.start ?? '')]);
  }

  if (strike) {
    scheduleRows.push([strike.startTime ?? '', 'Strike Begins', '']);
  }

  // Add blank rows for additional scheduling
  const blankRowsNeeded = Math.max(0, 8 - scheduleRows.length);
  for (let i = 0; i < blankRowsNeeded; i++) {
    scheduleRows.push(['', '', '']);
  }

  children.push(dataTable(scheduleCols, scheduleRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 8. Notes
  // ------------------------------------------------------------------
  children.push(heading('Notes', 2));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));
  children.push(spacer(200));
  children.push(body('________________________________________________________________________', { color: 'DDDDDD' }));

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Crew Call Sheet',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
