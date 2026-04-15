/**
 * Proposal Document Template
 *
 * Full branded proposal document with cover page, phase breakdowns,
 * deliverables, add-ons, milestones, venues, terms, and signature block.
 */

import type {
  Organization,
  Proposal,
  Client,
  Phase,
  Venue,
  MilestoneGate,
  MilestoneRequirement,
  TermsDocument,
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
  phaseHeader,
  narrativeBlock,
  milestoneGateBox,
  addonTable,
  signatureBlock,
  formatCurrency,
  formatDate,
  pageBreak,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import {
  castDocAddress,
  castDocContact,
  castLoadInStrikeEntry,
  castActivationDates,
} from '../doc-types';

import { castPaymentTerms } from '../json-casts';
import type { Json } from '@/types/database';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface ProposalData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  phases: Phase[];
  deliverablesByPhase: Map<string, Array<{ name: string; qty: number; unit_cost: number; total_cost: number; category: string | null; description: string | null }>>;
  addonsByPhase: Map<string, Array<{ name: string; qty: number; unit_cost: number; total_cost: number; selected: boolean; description: string | null }>>;
  milestonesByPhase: Map<string, Array<MilestoneGate & { requirements: MilestoneRequirement[] }>>;
  venues: Venue[];
  termsDocument?: TermsDocument | null;
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

export async function generateProposal(data: ProposalData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, phases, venues } = data;
  const pt = castPaymentTerms(proposal.payment_terms as Json);

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Cover Page
  // ------------------------------------------------------------------
  children.push(spacer(600));
  children.push(heading(proposal.name, 1));
  if (proposal.subtitle) {
    children.push(body(proposal.subtitle, { italic: true, size: 26, color: brand.secondaryColor, spacing: { after: 200 } }));
  }
  children.push(spacer(200));

  const coverInfo: Array<[string, string]> = [
    ['Prepared For', client.company_name ?? ''],
    ['Prepared Date', formatDate(proposal.prepared_date)],
    ['Valid Until', formatDate(proposal.valid_until)],
    ['Total Investment', formatCurrency(proposal.total_value)],
    ['Status', proposal.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
  ];

  children.push(kvTable(coverInfo, brand));

  if (proposal.narrative_context) {
    children.push(spacer());
    children.push(narrativeBlock(proposal.narrative_context as string, brand));
  }

  children.push(pageBreak());

  // ------------------------------------------------------------------
  // 2. Phase Breakdown
  // ------------------------------------------------------------------
  children.push(heading('Scope of Work', 1));

  for (const phase of phases) {
    children.push(...phaseHeader(
      phase.phase_number ?? String(phase.sort_order + 1).padStart(2, '0'),
      phase.name,
      brand,
      phase.narrative ?? undefined,
    ));

    // Phase investment summary
    children.push(
      labelValue('Phase Investment', formatCurrency(phase.phase_investment), brand),
    );
    children.push(spacer(100));

    // Deliverables table
    const deliverables = data.deliverablesByPhase.get(phase.id) ?? [];
    if (deliverables.length > 0) {
      children.push(heading('Deliverables', 3));
      const delCols: TableColumn[] = [
        { header: 'Item', width: Math.floor(CONTENT_WIDTH * 0.4) },
        { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.15) },
        { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.1) },
        { header: 'Unit Cost', width: Math.floor(CONTENT_WIDTH * 0.15) },
        { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.2) },
      ];
      const delRows = deliverables.map((d) => [
        d.name,
        d.category ?? '',
        String(d.qty),
        formatCurrency(d.unit_cost),
        formatCurrency(d.total_cost),
      ]);
      children.push(dataTable(delCols, delRows, brand));
      children.push(spacer(100));
    }

    // Add-ons
    const addons = data.addonsByPhase.get(phase.id) ?? [];
    if (addons.length > 0) {
      children.push(heading('Optional Add-Ons', 3));
      children.push(
        addonTable(
          addons.map((a) => ({
            name: a.name,
            description: a.description ?? undefined,
            cost: formatCurrency(a.total_cost),
            selected: a.selected,
          })),
          brand,
        ),
      );
      children.push(spacer(100));
    }

    // Milestones
    const milestones = data.milestonesByPhase.get(phase.id) ?? [];
    for (const ms of milestones) {
      const requirements = ms.requirements.map((r) => r.text ?? '');
      children.push(
        ...milestoneGateBox(
          ms.name,
          requirements,
          ms.unlocks_description ? [`Unlocks: ${ms.unlocks_description}`] : [],
          brand,
        ),
      );
    }

    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 3. Venue Information
  // ------------------------------------------------------------------
  if (venues.length > 0) {
    children.push(pageBreak());
    children.push(heading('Venues', 1));

    for (const venue of venues) {
      children.push(heading(venue.name ?? 'Venue', 2));

      const venueInfo: Array<[string, string]> = [
        ['Address', formatAddress(castDocAddress(venue.address))],
        ['Type', venue.type ?? ''],
      ];

      const actDates = castActivationDates(venue.activation_dates);
      if (actDates) {
        venueInfo.push(['Activation', `${formatDate(actDates.start ?? '')} \u2013 ${formatDate(actDates.end ?? '')}`]);
      }

      const loadIn = castLoadInStrikeEntry(venue.load_in);
      if (loadIn) {
        venueInfo.push(['Load-In', `${formatDate(loadIn.date ?? '')}: ${loadIn.startTime ?? ''} \u2013 ${loadIn.endTime ?? ''}`]);
      }

      const strike = castLoadInStrikeEntry(venue.strike);
      if (strike) {
        venueInfo.push(['Strike', `${formatDate(strike.date ?? '')}: ${strike.startTime ?? ''} \u2013 ${strike.endTime ?? ''}`]);
      }

      children.push(kvTable(venueInfo, brand));

      const contact = castDocContact(venue.contact_on_site);
      if (contact?.name) {
        children.push(spacer(80));
        children.push(labelValue('On-Site Contact', `${contact.name} \u2014 ${contact.phone ?? ''} \u2014 ${contact.email ?? ''}`, brand));
      }

      children.push(spacer());
    }
  }

  // ------------------------------------------------------------------
  // 4. Payment Terms
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Investment & Payment Terms', 1));

  const paymentInfo: Array<[string, string]> = [
    ['Total Investment', formatCurrency(proposal.total_value)],
  ];

  if (pt) {
    paymentInfo.push(['Payment Structure', pt.structure ?? '']);
    if (pt.depositPercent) paymentInfo.push(['Deposit', `${pt.depositPercent}%`]);
    if (pt.balancePercent) paymentInfo.push(['Balance', `${pt.balancePercent}%`]);
  }

  children.push(kvTable(paymentInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 5. Terms & Conditions
  // ------------------------------------------------------------------
  if (data.termsDocument) {
    children.push(heading('Terms & Conditions', 1));

    const sections = (data.termsDocument.sections as Array<{ title: string; body: string; order?: number }>) ?? [];
    const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (let i = 0; i < sorted.length; i++) {
      const section = sorted[i];
      children.push(heading(`${i + 1}. ${section.title}`, 3));
      children.push(body(section.body, { spacing: { after: 120 } }));
    }

    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Signature Block
  // ------------------------------------------------------------------
  children.push(heading('Acceptance', 2));
  children.push(
    body(
      'By signing below, the parties agree to the scope of work, investment, and terms described in this proposal.',
      { spacing: { after: 200 } },
    ),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Client Representative', name: client.company_name ?? '' },
        { role: 'Account Executive', name: data.org.name },
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
    documentTitle: 'Proposal',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
