/**
 * Production Schedule / Timeline Document
 *
 * Generates a DOCX production schedule with team roster, phase timeline,
 * milestone detail, venue schedule, and key dates summary.
 */

import type {
  Organization,
  Proposal,
  Client,
  Phase,
  MilestoneGate,
  MilestoneRequirement,
  Venue,
  TeamAssignment,
  User,
} from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  buildNumbering,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  pageBreak,
  bullet,
  checkbox,
  labelValue,
  dataTable,
  formatDate,
  formatCurrency,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ProductionScheduleData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  phases: Phase[];
  milestones: Array<MilestoneGate & { requirements: MilestoneRequirement[] }>;
  venues: Venue[];
  teamAssignments: Array<TeamAssignment & { user: User }>;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Status emoji helpers
// ---------------------------------------------------------------------------

function phaseStatusEmoji(status: string): string {
  switch (status) {
    case 'complete':
    case 'approved':
      return '\u2713'; // checkmark
    case 'in_progress':
    case 'pending_approval':
      return '\u25CF'; // filled circle
    default:
      return '\u25CB'; // open circle
  }
}

function milestoneStatusEmoji(status: string): string {
  switch (status) {
    case 'complete':
      return '\u2713';
    case 'in_progress':
      return '\u25CF';
    default:
      return '\u25CB';
  }
}

// ---------------------------------------------------------------------------
// Helpers to format venue address
// ---------------------------------------------------------------------------

function formatAddress(addr: { street?: string; city?: string; state?: string; zip?: string; country?: string } | null): string {
  if (!addr) return '';
  const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean);
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateProductionSchedule(data: ProductionScheduleData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, phases, milestones, venues, teamAssignments } = data;

  // Build a map from phase_id to milestone for quick lookup
  const milestoneByPhase = new Map<string, MilestoneGate & { requirements: MilestoneRequirement[] }>();
  for (const ms of milestones) {
    milestoneByPhase.set(ms.phase_id, ms);
  }

  // Sort phases by sort_order
  const sortedPhases = [...phases].sort((a, b) => a.sort_order - b.sort_order);

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('PRODUCTION SCHEDULE', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 80 } }));
  children.push(body(client.company_name, { italic: true, color: brand.secondaryColor, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Project Timeline Overview
  // ------------------------------------------------------------------
  children.push(heading('Project Timeline Overview', 2));
  children.push(labelValue('Prepared', formatDate(proposal.prepared_date), brand));
  children.push(labelValue('Valid Until', formatDate(proposal.valid_until), brand));
  children.push(labelValue('Total Phases', String(sortedPhases.length), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Team Roster
  // ------------------------------------------------------------------
  children.push(heading('Team Roster', 2));

  const teamCols: TableColumn[] = [
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Role', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Title', width: Math.floor(CONTENT_WIDTH * 0.3) },
  ];

  const teamRows = teamAssignments.map((ta) => [
    ta.user.full_name,
    ta.role,
    ta.user.title ?? '',
  ]);

  if (teamRows.length > 0) {
    children.push(dataTable(teamCols, teamRows, brand));
  } else {
    children.push(body('No team members assigned.', { italic: true }));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Phase Timeline Table
  // ------------------------------------------------------------------
  children.push(heading('Phase Timeline', 2));

  const timelineCols: TableColumn[] = [
    { header: 'Phase #', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Name', width: Math.floor(CONTENT_WIDTH * 0.25) },
    { header: 'Status', width: Math.floor(CONTENT_WIDTH * 0.15) },
    { header: 'Milestone', width: Math.floor(CONTENT_WIDTH * 0.3) },
    { header: 'Milestone Status', width: Math.floor(CONTENT_WIDTH * 0.2) },
  ];

  const timelineRows = sortedPhases.map((phase) => {
    const ms = milestoneByPhase.get(phase.id);
    return [
      phase.phase_number,
      phase.name,
      `${phaseStatusEmoji(phase.status)} ${phase.status.replace(/_/g, ' ')}`,
      ms?.name ?? '\u2014',
      ms ? `${milestoneStatusEmoji(ms.status)} ${ms.status.replace(/_/g, ' ')}` : '\u2014',
    ];
  });

  children.push(dataTable(timelineCols, timelineRows, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Milestone Detail
  // ------------------------------------------------------------------
  const phasesWithMilestones = sortedPhases.filter((p) => milestoneByPhase.has(p.id));

  if (phasesWithMilestones.length > 0) {
    children.push(heading('Milestone Detail', 2));

    for (const phase of phasesWithMilestones) {
      const ms = milestoneByPhase.get(phase.id)!;
      children.push(heading(`${ms.name}`, 3));

      // Requirements checklist
      const sortedReqs = [...ms.requirements].sort((a, b) => a.sort_order - b.sort_order);
      for (const req of sortedReqs) {
        const isChecked = req.status === 'complete' || req.status === 'waived';
        children.push(checkbox(`${req.text} (${req.assignee})`, isChecked));
      }

      // Unlocks description
      if (ms.unlocks_description) {
        children.push(spacer(80));
        children.push(labelValue('Unlocks', ms.unlocks_description, brand));
      }

      children.push(spacer());
    }
  }

  // ------------------------------------------------------------------
  // 6. Venue Schedule
  // ------------------------------------------------------------------
  if (venues.length > 0) {
    children.push(pageBreak());
    children.push(heading('Venue Schedule', 2));

    const venueCols: TableColumn[] = [
      { header: 'Venue Name', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Address', width: Math.floor(CONTENT_WIDTH * 0.25) },
      { header: 'Activation Dates', width: Math.floor(CONTENT_WIDTH * 0.2) },
      { header: 'Load-In Time', width: Math.floor(CONTENT_WIDTH * 0.175) },
      { header: 'Strike Time', width: Math.floor(CONTENT_WIDTH * 0.175) },
    ];

    const venueRows = venues
      .sort((a, b) => a.sequence - b.sequence)
      .map((v) => {
        const activationStr = v.activation_dates
          ? `${formatDate(v.activation_dates.start)} \u2013 ${formatDate(v.activation_dates.end)}`
          : '\u2014';
        const loadInStr = v.load_in
          ? `${formatDate(v.load_in.date)} ${v.load_in.startTime}\u2013${v.load_in.endTime}`
          : '\u2014';
        const strikeStr = v.strike
          ? `${formatDate(v.strike.date)} ${v.strike.startTime}\u2013${v.strike.endTime}`
          : '\u2014';

        return [v.name, formatAddress(v.address), activationStr, loadInStr, strikeStr];
      });

    children.push(dataTable(venueCols, venueRows, brand));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 7. Key Dates Summary
  // ------------------------------------------------------------------
  children.push(heading('Key Dates Summary', 2));

  // Collect all notable dates
  if (proposal.prepared_date) {
    children.push(bullet(`Prepared: ${formatDate(proposal.prepared_date)}`));
  }
  if (proposal.valid_until) {
    children.push(bullet(`Valid Until: ${formatDate(proposal.valid_until)}`));
  }
  if (proposal.expected_close_date) {
    children.push(bullet(`Expected Close: ${formatDate(proposal.expected_close_date)}`));
  }

  // Venue activation dates
  for (const v of venues.sort((a, b) => a.sequence - b.sequence)) {
    if (v.activation_dates) {
      children.push(bullet(`${v.name} Activation: ${formatDate(v.activation_dates.start)} \u2013 ${formatDate(v.activation_dates.end)}`));
    }
    if (v.load_in) {
      children.push(bullet(`${v.name} Load-In: ${formatDate(v.load_in.date)}`));
    }
    if (v.strike) {
      children.push(bullet(`${v.name} Strike: ${formatDate(v.strike.date)}`));
    }
  }

  // Milestone completion dates
  for (const ms of milestones) {
    if (ms.completed_at) {
      children.push(bullet(`${ms.name} Completed: ${formatDate(ms.completed_at)}`));
    }
  }

  // Requirement due dates
  for (const ms of milestones) {
    for (const req of ms.requirements) {
      if (req.due_date) {
        children.push(bullet(`${req.text}: Due ${formatDate(req.due_date)}`));
      }
    }
  }

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Production Schedule',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
