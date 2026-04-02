/**
 * Load-In & Strike Schedule Document
 *
 * Generates a DOCX schedule with per-venue load-in/strike times,
 * crew assignments, logistics notes, and safety protocol reminders.
 */

import type {
  Organization,
  Proposal,
  Client,
  Venue,
  TeamAssignment,
  User,
  Phase,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  pageBreak,
  bullet,
  labelValue,
  calloutBox,
  dataTable,
  kvTable,
  formatDate,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface LoadInStrikeData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  venues: Venue[];
  teamAssignments: Array<TeamAssignment & { user: User }>;
  phases: Phase[];
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

export async function generateLoadInStrike(data: LoadInStrikeData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, venues, teamAssignments, phases } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('LOAD-IN & STRIKE SCHEDULE', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 80 } }));
  children.push(body(client.company_name, { italic: true, color: brand.secondaryColor, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Project Overview
  // ------------------------------------------------------------------
  children.push(heading('Project Overview', 2));
  children.push(labelValue('Project', proposal.name, brand));
  children.push(labelValue('Client', client.company_name, brand));
  children.push(labelValue('Total Venues', String(venues.length), brand));
  children.push(labelValue('Total Phases', String(phases.length), brand));
  children.push(labelValue('Prepared Date', formatDate(proposal.prepared_date), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Per-venue sections
  // ------------------------------------------------------------------
  const sortedVenues = [...venues].sort((a, b) => a.sequence - b.sequence);

  for (let vi = 0; vi < sortedVenues.length; vi++) {
    const venue = sortedVenues[vi];

    if (vi > 0) {
      children.push(pageBreak());
    }

    // Venue header
    children.push(heading(`Venue: ${venue.name}`, 2));

    const venueInfo: Array<[string, string]> = [
      ['Address', formatAddress(venue.address)],
      ['Venue Type', venue.type],
    ];

    if (venue.contact_on_site) {
      venueInfo.push(['Site Contact', venue.contact_on_site.name]);
      venueInfo.push(['Contact Phone', venue.contact_on_site.phone]);
      venueInfo.push(['Contact Email', venue.contact_on_site.email]);
    }

    children.push(kvTable(venueInfo, brand));
    children.push(spacer());

    // Load-In Schedule
    children.push(heading('Load-In Schedule', 3));
    if (venue.load_in) {
      children.push(labelValue('Date', formatDate(venue.load_in.date), brand));
      children.push(labelValue('Start Time', venue.load_in.startTime, brand));
      children.push(labelValue('End Time', venue.load_in.endTime, brand));
    } else {
      children.push(body('Load-in schedule not yet confirmed.', { italic: true }));
    }

    // Venue constraints
    if (venue.constraints && Object.keys(venue.constraints).length > 0) {
      children.push(spacer(80));
      children.push(body('Venue Constraints:', { bold: true }));
      for (const [key, value] of Object.entries(venue.constraints)) {
        children.push(bullet(`${key}: ${String(value)}`));
      }
    }
    children.push(spacer());

    // Strike Schedule
    children.push(heading('Strike Schedule', 3));
    if (venue.strike) {
      children.push(labelValue('Date', formatDate(venue.strike.date), brand));
      children.push(labelValue('Start Time', venue.strike.startTime, brand));
      children.push(labelValue('End Time', venue.strike.endTime, brand));
    } else {
      children.push(body('Strike schedule not yet confirmed.', { italic: true }));
    }
    children.push(spacer());

    // Activation Dates
    children.push(heading('Activation Dates', 3));
    if (venue.activation_dates) {
      children.push(
        labelValue(
          'Activation Period',
          `${formatDate(venue.activation_dates.start)} \u2192 ${formatDate(venue.activation_dates.end)}`,
          brand,
        ),
      );
    } else {
      children.push(body('Activation dates not yet confirmed.', { italic: true }));
    }
    children.push(spacer());

    // Crew Assigned
    children.push(heading('Crew Assigned', 3));

    const crewCols: TableColumn[] = [
      { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.3) },
      { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Phone', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Email', width: Math.floor(CONTENT_WIDTH * 0.25) },
    ];

    const crewRows = teamAssignments.map((ta) => [
      ta.user.full_name,
      ta.role,
      ta.user.phone ?? '',
      ta.user.email,
    ]);

    if (crewRows.length > 0) {
      children.push(dataTable(crewCols, crewRows, brand));
    } else {
      children.push(body('No crew members assigned.', { italic: true }));
    }
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 4. Logistics Notes
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Logistics Notes', 2));

  for (const venue of sortedVenues) {
    if (venue.notes || (venue.constraints && Object.keys(venue.constraints).length > 0)) {
      children.push(heading(`${venue.name}`, 3));

      if (venue.notes) {
        children.push(body(venue.notes));
      }

      if (venue.constraints && Object.keys(venue.constraints).length > 0) {
        children.push(body('Constraints:', { bold: true, spacing: { before: 80 } }));
        for (const [key, value] of Object.entries(venue.constraints)) {
          children.push(bullet(`${key}: ${String(value)}`));
        }
      }

      children.push(spacer());
    }
  }

  // ------------------------------------------------------------------
  // 5. Safety Protocols
  // ------------------------------------------------------------------
  children.push(heading('Safety Protocols', 2));
  children.push(
    calloutBox(
      'All crew members must complete a safety briefing before beginning load-in or strike operations. Personal protective equipment (PPE) is mandatory on all job sites. Report any hazards or incidents immediately to the site supervisor.',
      brand,
      '\u26A0\uFE0F',
    ),
  );
  children.push(spacer());
  children.push(bullet('Hard hats required in all active work zones'));
  children.push(bullet('Steel-toed boots mandatory'));
  children.push(bullet('High-visibility vests required during load-in and strike'));
  children.push(bullet('Lifting protocol: team lift for items over 50 lbs'));
  children.push(bullet('Emergency exits must remain clear at all times'));
  children.push(bullet('First aid kit location to be confirmed at safety briefing'));

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Load-In & Strike Schedule',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
